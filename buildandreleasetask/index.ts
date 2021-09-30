import tl = require('azure-pipelines-task-lib/task');
import process = require("child_process");
const spawn = require("await-spawn");

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
async function installIfNotExists(path: string, tool: string) {
    const options = {
        cwd: path + '\\node_modules\\.bin',
        shell: true
    };
    try {
        var sass = await spawn(tool, ['--version'], options);
        console.log(`${tool} version using: ${sass.toString()}`);

    } catch (error) {
        console.log(`${tool} version not installed`);
        console.log(`installing latest version of ${tool}`);

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
            var install = await spawn(`npm install`, ['--no-save', tool], options2);
            console.log(`latest ${tool} installed`);
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
        let style: string | undefined = tl.getInput('style');
        let enableVendorPrefixing: boolean | undefined = tl.getBoolInput('enableVendorPrefixing');

        let _baseWorkingDirectory = tl.getVariable('Agent.ToolsDirectory');


        // //tests: remove later
        // inputFile = 'D:\\Sources\\My Agent\\stylesheets\\_base.scss';
        // outputFile = 'Z:\\Sources\\My Agent\\core.css';
        // enableVendorPrefixing = true;
        // _baseWorkingDirectory = 'D:\\Sources\\MyAgent';
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

        await installIfNotExists(_baseWorkingDirectory + '\\sass', 'sass');
        if (enableVendorPrefixing) {
            await installIfNotExists(_baseWorkingDirectory + '\\autoprefixer', 'autoprefixer-cli');
        }
        await compile(inputFile, outputFile, style, enableVendorPrefixing, _workingDirectorySass, _workingDirectoryPrefixer);

    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();