sftools
=======

A compilation of Sfdx plugins that make working with Org Management/Test Runs easier.

[![Version](https://img.shields.io/npm/v/sftools.svg)](https://npmjs.org/package/@knambiar/sftools)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/Pyronewbic/sftools?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sftools/branch/master)
[![Codecov](https://codecov.io/gh/Pyronewbic/sftools/branch/master/graph/badge.svg)](https://codecov.io/gh/Pyronewbic/sftools)
[![Known Vulnerabilities](https://snyk.io/test/github/Pyronewbic/sftools/badge.svg)](https://snyk.io/test/github/Pyronewbic/sftools)
[![Downloads/week](https://img.shields.io/npm/dw/sftools.svg)](https://npmjs.org/package/@knambiar/sftools)
[![License](https://img.shields.io/npm/l/sftools.svg)](https://github.com/Pyronewbic/sftools/blob/master/package.json)

<!-- toc -->

<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g @knambiar/sftools
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
@knambiar/sftools/1.0.1 win32-x64 node-v12.0.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx tools:apex:test:run [name=value...] [-e <string>] [-l <string>] [-t <number>] [-n <string>] [-p] [-v <string>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-toolsapextestrun-namevalue--e-string--l-string--t-number--n-string--p--v-string--u-string---apiversion-string---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx tools:repo:deploy [name=value...] -t <string> -b <string> [-s] [-w <string>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-toolsrepodeploy-namevalue--t-string--b-string--s--w-string--u-string---apiversion-string---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx tools:apex:test:run [name=value...] [-e <string>] [-l <string>] [-t <number>] [-n <string>] [-p] [-v <string>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

```
USAGE
  $ sfdx tools:apex:test:run [name=value...] [-e <string>] [-l <string>] [-t <number>] [-n <string>] [-p] [-v <string>] 
  [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --expath=expath                                                               Path For The Exemption List
  -l, --level=level                                                                 Test Levels

  -n, --classnames=classnames                                                       Classnames you're running if it
                                                                                    isn't one of the Log Levels

  -p, --parallel                                                                    Pass the flag to run tests in
                                                                                    parallel mode in your Org

  -t, --retrytime=retrytime                                                         Ms to wait for a class before it is
                                                                                    retried

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --verbose                                                                         emit additional command output to
                                                                                    stdout

EXAMPLE
  $ sfdx tools:apex:test:run -e <Path to exemption file> -t <retry time>
     
          This runs tests in serial/parallel mode - while aborting any ApexClasses that have been stuck in a Loop (A 
  Known platform bug), and updates values on ApexTestResult. 
          Also Saves Junits to /tests, so you can process them
```

_See code: [lib\commands\tools\apex\test\run.js](https://github.com/Pyronewbic/sftools/blob/v1.0.1/lib\commands\tools\apex\test\run.js)_

## `sfdx tools:repo:deploy [name=value...] -t <string> -b <string> [-s] [-w <string>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

```
USAGE
  $ sfdx tools:repo:deploy [name=value...] -t <string> -b <string> [-s] [-w <string>] [-u <string>] [--apiversion 
  <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -b, --cbranch=cbranch                                                             (required) Current branch

  -s, --settings                                                                    Try To deploy settings to org first
                                                                                    (If found)

  -t, --tbranch=tbranch                                                             (required) Target Branch to compare
                                                                                    to

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -w, --workspace=workspace                                                         workspace where you have the
                                                                                    components stored

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --verbose                                                                         emit additional command output to
                                                                                    stdout

EXAMPLE
  $ sfdx tools:repo:deploy -t "origin/CQA" -b "origin/xyzRelease" -s -u orgName
        
           Deploys the difference between two branches to an org
           1) Tries to Deploy any modified settings first.
           2) If successful, Deploys the rest of the source to the org
           3) Creates a list of deployed source and adds it to a json file, for reference
```

_See code: [lib\commands\tools\repo\deploy.js](https://github.com/Pyronewbic/sftools/blob/v1.0.1/lib\commands\tools\repo\deploy.js)_
<!-- commandsstop -->
* [`sfdx tools:apex:test:run [name=value...] [-e <string>] [-l <string>] [-t <number>] [-n <string>] [-p] [-v <string>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-toolsapextestrun-namevalue--e-string--l-string--t-number--n-string--p--v-string--u-string---apiversion-string---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx tools:apex:test:run [name=value...] [-e <string>] [-l <string>] [-t <number>] [-n <string>] [-p] [-v <string>] [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

```
USAGE
  $ sfdx tools:apex:test:run [name=value...] [-e <string>] [-l <string>] [-t <number>] [-n <string>] [-p] [-v <string>] 
  [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -e, --expath=expath                                                               Path For The Exemption List
  -l, --level=level                                                                 Test Levels

  -n, --classnames=classnames                                                       Classnames you're running if it
                                                                                    isn't one of the Log Levels

  -p, --parallel                                                                    Pass the flag to run tests in
                                                                                    parallel mode in your Org

  -t, --retrytime=retrytime                                                         Ms to wait for a class before it is
                                                                                    retried

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --verbose                                                                         emit additional command output to
                                                                                    stdout

EXAMPLE
  $ sfdx tools:apex:test:run -e <Path to exemption file> -t <retry time> 
          This runs tests in serial/parallel mode - while aborting any ApexClasses that have been stuck in a Loop (A 
  Known platform bug), and updates values on ApexTestResult. Also Saves Junits to /tests
```

_See code: [lib\commands\tools\apex\test\run.js](https://github.com/Pyronewbic/sftools/blob/v1.0.1/lib\commands\tools\apex\test\run.js)_
