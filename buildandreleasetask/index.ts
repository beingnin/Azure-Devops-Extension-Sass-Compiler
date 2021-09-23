import tl = require('azure-pipelines-task-lib/task');
import { async } from 'q';
const { spawn } = require("child_process");

async function compile(input: string, output: string, style: string, enableVendorPrefixing: boolean, workingDirectory: string) {


    const options = {
        cwd: workingDirectory,
        shell: true
    };
    console.log(options);
    console.log('enableVendorPrefixing:', enableVendorPrefixing);
    const sass = spawn("sass", [input, output, (style === 'minified' ? '--style compressed' : '--style expanded'),'--no-source-map'], options);

    sass.stdout.on("data", (data: any) => {
        console.log(`stdout: ${data}`);
    });

    sass.stderr.on("data", (data: any) => {
        console.log(`stderr: ${data}`);
    });

    sass.on('error', (error: any) => {
        console.error(`error: ${error.message}`);
    });

    sass.on("close", (code: any) => {
        console.log(`sass exited with code ${code}`);
        //start vendor prefixing
        if (code == 0 && enableVendorPrefixing) {
            const options2 = {
                cwd: undefined,
                shell: true
            };

            const prefixer = spawn("autoprefixer-cli", ['-o', output, output],options2);

            prefixer.stdout.on("data", (data: any) => {
                console.log(`stdout: ${data}`);
            });

            prefixer.stderr.on("data", (data: any) => {
                console.log(`stderr: ${data}`);
            });

            prefixer.on('error', (error: any) => {
                console.error(`error: ${error.message}`);
            });

            prefixer.on("close", (code: any) => {
                console.log(`autoprefixer exited with code ${code}`);
            });
        }
    });
}

async function run() {
    try {

        let inputFile: string | undefined = tl.getInput('inputFile');
        let outputFile: string | undefined = tl.getInput('outputFile');
        let workingDirectory: string | undefined = tl.getInput('workingDirectory');
        let style: string | undefined = tl.getInput('style');
        let enableVendorPrefixing: boolean | undefined = tl.getBoolInput('enableVendorPrefixing');

        //tests
        workingDirectory = "C:\\Users\\nithin.bc\\Downloads\\dart-sass";
        inputFile = '"D:\\Sources\\ADS\\Pilot Run\\SHJSP.Egate\\EGATE\\EgateContent\\Styles\\stylesheets\\_base.scss"';
        outputFile = '"C:\\Users\\nithin.bc\\Desktop\\theme.css"';
        style = 'minified';
        enableVendorPrefixing = true;
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
        await compile(inputFile, outputFile, style, enableVendorPrefixing, workingDirectory);

        console.log('Task completed successfully');
    }
    catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

run();