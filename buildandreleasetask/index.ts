import tl = require('azure-pipelines-task-lib/task');
import process = require("child_process");
import { version } from 'punycode';
const semver = require("semver");
const spawn = require("await-spawn");
const regex=/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/g;

async function compile(input: string,
    output: string,
    style: string | undefined,
    enableVendorPrefixing: boolean,
    workingDirectorySass: string | undefined,
    workingDirectoryPrefixer: string | undefined) {

    //compile sass
    const options = {
        cwd: workingDirectorySass,
        shell: true
    };
    input = escapePath(input);
    output = escapePath(output);
    try {
        const sass = await spawn("sass", [input, output, (style === 'compressed' ? '--style compressed' : '--style expanded'), '--no-source-map'], options);
        console.log(sass.toString());
        console.log(`compiled sass file ${input} to ${output}`);
    } catch (error: any) {
        console.log('sass compilation thrown error');
        if (error.stderr) {
            console.log(error.stdout.toString());
            throw new Error(error.stderr.toString());
        }
        else {
            console.log(error);
            throw new Error(error.toString());
        }
    }
    //add vendor prefixes if asked by user
    if (enableVendorPrefixing) {
        const options2 = {
            cwd: workingDirectoryPrefixer,
            shell: true
        };
        try {
            const prefixer = await spawn("autoprefixer-cli", ['-o', output, output], options2);
            console.log(prefixer.toString());
            console.log(`vendor prefixes added in ${output}`);
        } catch (error: any) {
            console.log('vendor prefixing thrown error');
            if (error.stderr) {
                console.log(error.stdout.toString());
                throw new Error(error.stderr.toString());
            }
            else {
                console.log(error);
                throw new Error(error.toString());
            }
        }
    }

}
function escapePath(value: string): string {
    return '"' + value + '"';
}
async function installIfNotExists(path: string, tool: string, version: string | undefined) {

    if (!version) {
        version = 'latest';
    }

    const options = {
        cwd: path + '\\node_modules\\.bin',
        shell: true
    };
    try {
        let versionFinder = await spawn('npm', ['list', tool], options);
        let current: string | undefined = versionFinder.toString().match(regex)[0];
        let getVersions = await spawn('npm', ['view', tool,'versions'],options);
        let allVersions: string | undefined = getVersions.toString().match(regex);
        version = semver.maxSatisfying(allVersions,version==='latest'?'':version);
        console.log(`The current installed version for ${tool} is ${current}`);
        console.log(`The highest available version wrt the provided version range for ${tool} is ${version}`);
        if (!semver.eq(current, version)) {
            throw new Error('Current installed version doesn\'t match the latest specified version range');
        }

    } catch (error) {
        console.log(`installing ${version} version of ${tool}`);

        //create folder for npm package
        try {
            var mkdir = process.execSync('mkdir ' + escapePath(path));
        }
        catch (ex: any) {
            console.log(ex.toString());
        }
        const options2 = {
            cwd: path,
            shell: true
        };
        try {
            var install = await spawn(`npm install ${tool}@${version}`, ['--no-save'], options2);
            console.log(`${tool}@${version} installed`);
            console.log(install.toString());
        } catch (error: any) {
            console.log(`error occurred while trying to install ${tool}`);
            if (error.stderr) {
                throw new Error(error.stderr.toString());
            }
            else {
                console.log(error);
                throw new Error(error.toString());
            }
        }

    }
}
async function run() {
    try {

        let inputFile: string | undefined = tl.getInput('inputFile');
        let outputFile: string | undefined = tl.getInput('outputFile');
        let sassVersion: string | undefined = tl.getInput('sassVersion');
        let autoprefixerVersion: string | undefined = tl.getInput('autoprefixerVersion');
        let style: string | undefined = tl.getInput('style');
        let enableVendorPrefixing: boolean | undefined = tl.getBoolInput('enableVendorPrefixing');

        let _baseWorkingDirectory = tl.getVariable('Agent.ToolsDirectory');


        // //tests: remove later
        // inputFile = 'D:\\Sources\\ADS\\SPSA\\SHJP.Egate\\EGATE\\EgateContent\\Styles\\stylesheets\\_base.scss';
        // outputFile = 'D:\\Sources\\ADS\\SPSA\\SHJP.Egate\\EGATE\\EgateContent\\Styles\\stylesheets\\_compiled.css';
        // enableVendorPrefixing = true;
        // _baseWorkingDirectory = 'D:\\Sources\\My Agent';
        // sassVersion='1.39.x';
        // style = 'compressed';
        // //tests


        let _workingDirectorySass: string | undefined = _baseWorkingDirectory + '\\sass\\node_modules\\.bin';
        let _workingDirectoryPrefixer: string | undefined = _baseWorkingDirectory + '\\autoprefixer\\node_modules\\.bin';
        console.log(`using ${_baseWorkingDirectory} as tools directory`);

        //validations
        if (!inputFile) {
            tl.setResult(tl.TaskResult.Failed, 'Invalid input file');
            throw new Error('Invalid input file');
        }
        if (!outputFile) {
            tl.setResult(tl.TaskResult.Failed, 'Invalid output location');
            throw new Error('Invalid output location');
        }

        await installIfNotExists(_baseWorkingDirectory + '\\sass', 'sass', sassVersion);
        if (enableVendorPrefixing) {
            await installIfNotExists(_baseWorkingDirectory + '\\autoprefixer', 'autoprefixer-cli', autoprefixerVersion);
        }
        await compile(inputFile, outputFile, style, enableVendorPrefixing, _workingDirectorySass, _workingDirectoryPrefixer);

    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();