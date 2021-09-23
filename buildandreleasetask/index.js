"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const { spawn } = require("child_process");
function compile(input, output, style, enableVendorPrefixing, workingDirectory) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            cwd: workingDirectory,
            shell: true
        };
        console.log(options);
        console.log('enableVendorPrefixing:', enableVendorPrefixing);
        const sass = spawn("sass", [input, output, (style === 'minified' ? '--style compressed' : '--style expanded'), '--no-source-map'], options);
        sass.stdout.on("data", (data) => {
            console.log(`stdout: ${data}`);
        });
        sass.stderr.on("data", (data) => {
            console.log(`stderr: ${data}`);
        });
        sass.on('error', (error) => {
            console.error(`error: ${error.message}`);
        });
        sass.on("close", (code) => {
            console.log(`sass exited with code ${code}`);
            //start vendor prefixing
            if (code == 0 && enableVendorPrefixing) {
                const options2 = {
                    cwd: undefined,
                    shell: true
                };
                const prefixer = spawn("autoprefixer-cli", ['-o', output, output], options2);
                prefixer.stdout.on("data", (data) => {
                    console.log(`stdout: ${data}`);
                });
                prefixer.stderr.on("data", (data) => {
                    console.log(`stderr: ${data}`);
                });
                prefixer.on('error', (error) => {
                    console.error(`error: ${error.message}`);
                });
                prefixer.on("close", (code) => {
                    console.log(`autoprefixer exited with code ${code}`);
                });
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let inputFile = tl.getInput('inputFile');
            let outputFile = tl.getInput('outputFile');
            let workingDirectory = tl.getInput('workingDirectory');
            let style = tl.getInput('style');
            let enableVendorPrefixing = tl.getBoolInput('enableVendorPrefixing');
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
            yield compile(inputFile, outputFile, style, enableVendorPrefixing, workingDirectory);
            console.log('Task completed successfully');
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
