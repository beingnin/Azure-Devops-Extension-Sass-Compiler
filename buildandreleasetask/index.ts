import tl = require('azure-pipelines-task-lib/task');
import process = require("child_process");

async function compile(input: string,
    output: string,
    style: string | undefined,
    enableVendorPrefixing: boolean,
    workingDirectorySass: string | undefined,
    workingDirectoryPrefixer: string | undefined) {


    const options = {
        cwd: workingDirectorySass,
        shell: true
    };
    const sass = process.spawn("sass", [input, output, (style === 'compressed' ? '--style compressed' : '--style expanded'), '--no-source-map'], options);

    sass.stdout.on("data", (data: any) => {
        console.log(`sass stdout: ${data}`);
    });

    sass.stderr.on("data", (data: any) => {
        console.log(`sass stderr: ${data}`);
    });

    sass.on('error', (error: any) => {
        console.error(`sass error: ${error.message}`);
    });

    sass.on("close", (code: any) => {
        console.log(`sass exited with code ${code}`);
        if (code != 0) {
            throw new Error('Sass compiler exited with code ' + code)
        }
        //start vendor prefixing
        if (enableVendorPrefixing) {
            const options2 = {
                cwd: workingDirectoryPrefixer,
                shell: true
            };

            const prefixer = process.spawn("autoprefixer-cli", ['-o', output, output], options2);

            prefixer.stdout.on("data", (data: any) => {
                console.log(`autoprefixer stdout: ${data}`);
            });

            prefixer.stderr.on("data", (data: any) => {
                console.log(`autoprefixer stderr: ${data}`);
            });

            prefixer.on('error', (error: any) => {
                console.error(`autoprefixer error: ${error.message}`);
            });

            prefixer.on("close", (code: any) => {
                console.log(`autoprefixer exited with code ${code}`);
                if (code != 0) {
                    throw new Error('Autoprefixer exited with code ' + code)
                }
            });
        }
    });
}

async function run() {
    try {

        const inputFile: string | undefined = tl.getInput('inputFile');
        const outputFile: string | undefined = tl.getInput('outputFile');
        const workingDirectorySass: string | undefined = tl.getInput('workingDirectorySass');
        const workingDirectoryPrefixer: string | undefined = tl.getInput('workingDirectoryPrefixer');
        const style: string | undefined = tl.getInput('style');
        const enableVendorPrefixing: boolean | undefined = tl.getBoolInput('enableVendorPrefixing');




        //validations
        if (!inputFile) {
            tl.setResult(tl.TaskResult.Failed, 'Invalid input file');
            throw new Error('Invalid input file');
        }
        if (!outputFile) {
            tl.setResult(tl.TaskResult.Failed, 'Invalid output location');
            throw new Error('Invalid output location');
        }
        await compile(inputFile, outputFile, style, enableVendorPrefixing, workingDirectorySass, workingDirectoryPrefixer);

    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();