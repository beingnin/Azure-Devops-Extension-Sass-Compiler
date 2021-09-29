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
    try {
        const sass = await spawn("sass", [input, output, (style === 'compressed' ? '--style compressed' : '--style expanded'), '--no-source-map'], options);
        console.log(sass.toString());
        console.log(`compiled sass file ${input} to ${output}`);
    } catch (error: any) {
        console.log(error.stdout.toString());
        if (error.errorno !== 0) {
            console.error('sass compilation thrown error');
            throw new Error(error.stderr.toString());
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
            console.log(error.stdout.toString());
            if (error.errorno !== 0) {
                console.error('vendor prefixing thrown error');
                throw new Error(error.stderr.toString());
            }
        }
    }

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
            var mkdir = process.execSync('mkdir ' + path);
        }
        catch (ex: any) {
            console.log(ex)
        }
        const options2 = {
            cwd: path,
            shell: true
        };
        try {
            await spawn(`npm install ${tool}`, options2);
            console.log(`latest ${tool} installed`);
        } catch (error) {
            console.log(`error occurred while trying to install ${tool}`);
            console.log(error);
        }

    }
}
async function run() {
    try {

        let inputFile: string | undefined = tl.getInput('inputFile');
        let outputFile: string | undefined = tl.getInput('outputFile');
        let style: string | undefined = tl.getInput('style');
        let enableVendorPrefixing: boolean | undefined = tl.getBoolInput('enableVendorPrefixing');

        const _baseWorkingDirectory = 'D:\\Sources\\OS\\Agent\\_tools'
        const _workingDirectorySass: string | undefined = _baseWorkingDirectory + '\\sass\\node_modules\\.bin';
        const _workingDirectoryPrefixer: string | undefined = _baseWorkingDirectory + '\\autoprefixer\\node_modules\\.bin';

        //tests: remove later
        inputFile = 'D:\\Sources\\OS\\Agent\\stylesheets\\_base.scss';
        outputFile = 'D:\\Sources\\OS\\Agent\\stylesheets\\core.css';
        enableVendorPrefixing=false;
        //tests

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