import { SfdxCommand, FlagsConfig, flags } from '@salesforce/command'
import { SfdxError, Connection } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'
import { ApexTestRunCommand } from 'salesforce-alm/dist/commands/force/apex/test/run'
import { ApexTestReportCommand } from 'salesforce-alm/dist/commands/force/apex/test/report'
import { DataRecordUpdateCommand } from 'salesforce-alm/dist/commands/force/data/record/update'
import { DataRecordCreateCommand } from 'salesforce-alm/dist/commands/force/data/record/create'
import { ApexSettings } from '../../../../lib/settings/setting'
import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'
import * as _ from 'lodash'
const readFile = promisify(fs.readFile)

export default class Run extends SfdxCommand {

  public static examples = [
    `$ sfdx tools:apex:test:run -e <Path to exemption file> -t <retry time>
     
       This runs tests in serial/parallel mode - while aborting any ApexClasses that have been stuck in a Loop (A Known platform bug), and updates values on ApexTestResult. 
       Also Saves Junits to /tests, so you can process them`
  ]
  protected static requiresUsername = true
  protected static supportsDevhubUsername = true
  protected static requiresProject = true
  protected static varargs = true
  private conn: Connection
  private TIMEOUT: string = '3600'
  // private ECONNRESETS: number = 1

  protected static flagsConfig: FlagsConfig = {

    expath: flags.string({
      char: 'e',
      required: false,
      description: 'Path For The Exemption List'
    }),

    level: flags.string({
      char: 'l',
      required: false,
      description: 'Test Levels'
    }),

    retrytime: flags.number({
      char: 't',
      required: false,
      description: 'Ms to wait for a class before it is retried'
    }),

    classnames: flags.string({
      char: 'n',
      required: false,
      description: `Classnames you're running if it isn't one of the Log Levels`
    }),

    parallel: flags.boolean({
      char: 'p',
      description: 'Pass the flag to run tests in parallel mode in your Org'
    }),

    verbose: flags.builtin()

  }

  public async run(): Promise<AnyJson> {
  
    this.conn = this.org.getConnection()
    if (this.flags.wait) {
      this.TIMEOUT = this.flags.wait
    }
    
    if(this.flags.parallel){
      await this.enableParallel(this.flags.parallel)
    }else{
      await this.enableParallel(false)
    }
  
    let id : any = await this.runTest()
    await this.saveReport(id)
    await this.getTestResults(id)
    return process.exit(0)
  }

  private async runTest(): Promise<AnyJson> {

    ApexTestRunCommand.id = 'force:apex:test:run'
    let testRun: any
    if (this.flags.level) {
      testRun = await ApexTestRunCommand.run(['-u', this.flags.targetusername, '--json', '-l', this.flags.level])
    } else if(this.flags.classnames) {
      this.ux.log(`Running for Specific TestClassNames!`)
      testRun = await ApexTestRunCommand.run(['-u', this.flags.targetusername, '--json', '-n', this.flags.classnames])
    }
    
    let testRunId = testRun.testRunId
    try {
      let time = this.flags.retrytime
      let skippedIds = []
      let flag = true

      DataRecordUpdateCommand.id = 'force:apex:data:update'
      DataRecordCreateCommand.id = 'force:apex:data:create'

      do {
        let res: any = await this.conn.query(`select Id,ApexClassId,MethodName,RunTime,ApexClass.Name FROM ApexTestResult where AsyncApexJobId='${testRunId}' and RunTime>${time} and ApexTestResult.ApexClassId in (select ApexTestQueueItem.ApexClassId from ApexTestQueueItem where Status='Processing' and ParentJobId='${testRunId}')`)

        if (res.records.length > 0) {
          for (const record of res.records) {
            if (skippedIds.includes[record.ApexClassId]) {
              this.ux.log(`ApexClassId ${record.ApexClassId} for ${record.ApexClass.Name} has already been Aborted, and records on ApexTestResult have been updated!`)
            } else {
              this.ux.log(`Aborting ApexClassId ${record.ApexClassId} since ${record.ApexClass.Name}.${record.MethodName} has crossed it's Threshold of ${time} milliseconds!`)
              await DataRecordUpdateCommand.run(['-s', 'ApexTestQueueItem', '-w', `ParentJobId=${testRunId} ApexClassId=${record.ApexClassId}`, '-v', 'status=Aborted'])
              skippedIds.push(record.ApexClassId)
              let resp = await this.conn.query(`select Id,ApexClass.Name,MethodName from ApexTestResult where AsyncApexJobId='${testRunId}' and ApexClassId='${record.ApexClassId}'`)
              let rec: any
              for (rec of resp.records) {
                this.ux.log(`Updating ${rec.ApexClass.Name}.${rec.MethodName} with Id ${rec.Id} as Fail with an error Message!`)
                await DataRecordUpdateCommand.run(['-s', 'ApexTestResult', '-i', rec.Id, '-v', `Outcome=Fail Message='Class Was Looping!'`])
              }
              this.ux.log('\n')
            }
          }
        }

        await new Promise(r => setTimeout(r, 30000))

        let resp: any = await this.conn.query(`select Status FROM ApexTestRunResult where AsyncApexJobId='${testRunId}'`)
        if (resp.records[0].Status == 'Completed' || resp.records[0].Status == 'Failed') {
          this.ux.log(`Running All Tests for id ${testRunId} is done!`)
          flag = false
        } else if (resp.records[0].Status == 'Aborted') {
          throw new SfdxError(`This Particular ApexTestRun has been Aborted!`)
        }
      } while (flag)

      await ApexTestReportCommand.run(['-w', this.TIMEOUT, '-i', testRunId, '-u', this.flags.targetusername, '--json'])
      return testRunId

    } catch (error) {
      if (error.syscall == 'ECONNRESET') {
        throw new SfdxError(error.info)
      } else {
        throw new SfdxError(error.message)
      }

    }

  }

  private async enableParallel(value: boolean) {
    try {
      let result: any = await new ApexSettings(this.conn).update('enableDisableParallelApexTesting', !value)

      if (result.success) {
        this.ux.log(`Parallel Testing on this org is set to ${value}`)
      } else {
        throw new SfdxError(`Changing Org Settings Failed!`)
      }
    } catch (error) {
      throw new SfdxError(error.message)
    }

  }

  private async saveReport(testRunId: any) {

    let testDir = path.join(process.cwd(), 'tests')
    let filePath = path.join(testDir, `test-result-${testRunId}-junit.xml`)

    if (fs.existsSync(filePath)) {
      this.ux.log(`Deleting ${filePath} to make updated report\n`)
      fs.unlinkSync(filePath)
    }

    if (!fs.existsSync(testDir)) {
      this.ux.log(`Creating Log Directory at: ${testDir}\n`)
      fs.mkdirSync(testDir)
    }

    ApexTestReportCommand.id = 'force:apex:test:report'
    await ApexTestReportCommand.run(['-w', this.TIMEOUT, '-i', testRunId, '-u', this.flags.targetusername, '-r', 'junit', '-d', testDir, '-c'])
    this.ux.log(`\n Report printed to ${filePath}\n`)
  }

  private async getTestResults(asyncJobId: string) {
    ApexTestReportCommand.id = 'force:apex:test:report'
    let results = await ApexTestReportCommand.run(['-w', this.TIMEOUT, '-i', asyncJobId, '-u', this.flags.targetusername, '--json'])

    if (results.summary.outcome == 'Failed') {

      if (this.flags.expath) {
        this.ux.log(`Reading Exemption List from ${this.flags.expath}`)
        let exemption: any = await readFile(this.flags.expath, 'utf-8')
        exemption = exemption.split(',')
        this.ux.log(`Exempted Test Classes are:\n`)
        this.ux.log(exemption)
        let fail = false

        for (const testResult of results.tests) {
          if (testResult.Outcome == 'Fail' && exemption.includes(testResult.FullName)) {
            fail = false
            this.ux.log(`${testResult.FullName} is skipped as it is in the Exemption List`)
          } else if (testResult.Outcome == 'Fail' && !exemption.includes(testResult.FullName)) {
            fail = true
            break
          }
        }

        if (fail) {
          this.ux.log(`Failed Test Execution with ${results.summary.failing} failed tests`)
          this.ux.log(`Classes have failed which weren't covered in the Exemption List`)
          this.ux.log(results.summary)
          return process.exit(1)
        } else {
          this.ux.log(`Current Test Class failures are covered in the Exemption List`)
          this.ux.log('Successful Test execution')
          this.ux.log(results.summary)
          return process.exit(0)
        }

      } else {
        this.ux.log(`Failed Test Execution with ${results.summary.failing} failed tests`)
        this.ux.log(results.summary)
        return process.exit(1)
      }
    } else {
      this.ux.log('Successful Test execution')
      this.ux.log(results.summary)
      return process.exit(0)
    }

  }

}
