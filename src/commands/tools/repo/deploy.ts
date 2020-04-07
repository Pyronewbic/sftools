import { SfdxCommand, FlagsConfig, flags } from '@salesforce/command'
import { Connection } from '@salesforce/core'
import { AnyJson } from '@salesforce/ts-types'
import { SourceDeployCommand } from 'salesforce-alm/dist/commands/force/source/deploy'
import { join } from 'path'
import { promisify } from 'util'
import { readFile, writeFile, exists } from 'fs'
import * as simplegit from 'simple-git/promise'
const readFileA = promisify(readFile)
const writeFileA = promisify(writeFile)
const existsA = promisify(exists)

export default class Diff extends SfdxCommand {

    public static examples = [
        `$ sfdx tools:repo:deploy -t "origin/CQA" -b "origin/xyzRelease" -s -u orgName
        
        Deploys the difference between two branches to an org
        1) Tries to Deploy any modified settings first.
        2) If successful, Deploys the rest of the source to the org
        3) Creates a list of deployed source and adds it to a json file, for reference` 
    ]
    protected static requiresUsername = true;
    protected static supportsDevhubUsername = false;
    protected static requiresProject = true;
    protected static varargs = true;
    private conn: Connection

    protected static flagsConfig: FlagsConfig = {

        tbranch: flags.string({
            char: 't',
            description: 'Target Branch to compare to',
            required: true
        }),

        cbranch: flags.string({
            char: 'b',
            description: 'Current branch',
            required: true
        }),

        settings: flags.boolean({
            char: 's',
            description: 'Try To deploy settings to org first (If found)'
        }),

        workspace: flags.string({
            char: 'w',
            description: 'workspace where you have the components stored'
        }),

        verbose: flags.builtin()
    }

    public async run(): Promise<AnyJson> {

        this.conn = this.org.getConnection()
        await this.work()
        return process.exit(0)
    }

    private async work() {
        try {
            let suffixes = []
            let jsonPath = `${join(process.cwd(), 'deployed.json')}`
            let res: any = await this.conn.metadata.describe()
            for (const record of res.metadataObjects) {
                if (record.metaFile && !record.inFolder) {
                    suffixes.push(record.suffix)
                }
            }
            SourceDeployCommand.id = 'force:source:deploy'
            const git = simplegit()
            if (this.flags.settings) {
                res = await git.diff([`${this.flags.tbranch}..${this.flags.cbranch}`, '--name-only', '--diff-filter=AM', `force-app/${this.flags.workspace}/default/settings/`])
                res = res.replace(/[\n]/g, ',').substr(0, res.length - 1)
                if (res.length == 0) {
                    this.ux.log(`No modified Settings found!`)
                } else {
                    this.ux.log(`Deploying Settings to ${this.conn.getUsername()}\n`)
                    await SourceDeployCommand.run(['-u', this.flags.targetusername, '-p', res])
                    let json = {
                        "deployed": []
                    }
                    for(const file of res.split(',')){
                        json.deployed.push(file)
                    }
                    this.ux.log(`Writing Deployed Settings to ${jsonPath}`)
                    await writeFileA(jsonPath,JSON.stringify(json,null,2),'utf-8')
                    
                }
            }

            if (this.flags.settings) {
                res = await git.diff([`${this.flags.tbranch}..${this.flags.cbranch}`, '--name-only', '--diff-filter=AM', 'force-app/', `:(exclude)force-app/${this.flags.workspace}/default/settings/*`])
            } else {
                res = await git.diff([`${this.flags.tbranch}..${this.flags.cbranch}`, '--name-only', '--diff-filter=AM', 'force-app/'])
            }

            res = res.replace(/[\n]/g, ',').substr(0, res.length - 1)
            if (res.length == 0) {
                this.ux.log(`No files picked up in this git Diff?`)
                return process.exit(0)
            }
            let filesArr: any = res.split(',')

            let withoutMeta = []
            let withMeta = []
            res = await this.conn.metadata.describe()
            for (const record of res.metadataObjects) {
                if (record.metaFile && !record.inFolder) {
                    withMeta.push(record)
                } else if (!record.metaFile && !record.inFolder) {
                    withoutMeta.push(record)
                }
            }
            for (const file of filesArr) {
                let wM: any = withMeta.filter(value => value.directoryName == file.split('/')[3])
                if (wM.length > 0) {
                    let metaPath = `${file}-meta.xml`
                    if (file.includes('-meta.xml')) {
                        continue
                    }
                    if (!filesArr.includes(metaPath)) {
                        this.ux.log(`This Pr does not include Metadata for ${file}!`)
                        this.ux.log(`Adding ${metaPath} to File Array`)
                        filesArr.push(metaPath)
                    }
                }

            }
            
            let filesNew: any = filesArr.join(',')
            this.ux.log(`\nDeploying Source to ${this.conn.getUsername()}\n`)
            await SourceDeployCommand.run(['-u', this.flags.targetusername, '-p', filesNew])

            if (await existsA(jsonPath)) {
                let json: any = await readFileA(jsonPath, 'utf-8')
               
                json = JSON.parse(json)
                for(const file of res.split(',')){
                    json.deployed.push(file)
                }
                await writeFileA('deployed.json',JSON.stringify(json,null,2),'utf-8')
                this.ux.log(`\nWriting Deployed Source to to ${jsonPath}`) 
            }
            process.exit(0)
        } catch (error) {
            this.ux.log(error.message)
            process.exit(1)
        }
    }

}