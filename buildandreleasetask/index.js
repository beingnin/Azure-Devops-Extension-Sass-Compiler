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
const process = require("child_process");
function compile(input, output, style, enableVendorPrefixing, workingDirectorySass, workingDirectoryPrefixer) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            cwd: workingDirectorySass,
            shell: true
        };
        const sass = process.spawn("sass", [input, output, (style === 'compressed' ? '--style compressed' : '--style expanded'), '--no-source-map'], options);
        sass.stdout.on("data", (data) => {
            console.log(`sass stdout: ${data}`);
        });
        sass.stderr.on("data", (data) => {
            console.log(`sass stderr: ${data}`);
        });
        sass.on('error', (error) => {
            console.error(`sass error: ${error.message}`);
        });
        sass.on("close", (code) => {
            console.log(`sass exited with code ${code}`);
            if (code != 0) {
                throw new Error('Sass compiler exited with code ' + code);
            }
            //start vendor prefixing
            if (enableVendorPrefixing) {
                const options2 = {
                    cwd: workingDirectoryPrefixer,
                    shell: true
                };
                const prefixer = process.spawn("autoprefixer-cli", ['-o', output, output], options2);
                prefixer.stdout.on("data", (data) => {
                    console.log(`autoprefixer stdout: ${data}`);
                });
                prefixer.stderr.on("data", (data) => {
                    console.log(`autoprefixer stderr: ${data}`);
                });
                prefixer.on('error', (error) => {
                    console.error(`autoprefixer error: ${error.message}`);
                });
                prefixer.on("close", (code) => {
                    console.log(`autoprefixer exited with code ${code}`);
                    if (code != 0) {
                        throw new Error('Autoprefixer exited with code ' + code);
                    }
                });
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const inputFile = tl.getInput('inputFile');
            const outputFile = tl.getInput('outputFile');
            const workingDirectorySass = tl.getInput('workingDirectorySass');
            const workingDirectoryPrefixer = tl.getInput('workingDirectoryPrefixer');
            const style = tl.getInput('style');
            const enableVendorPrefixing = tl.getBoolInput('enableVendorPrefixing');
            //validations
            if (!inputFile) {
                tl.setResult(tl.TaskResult.Failed, 'Invalid input file');
                throw new Error('Invalid input file');
            }
            if (!outputFile) {
                tl.setResult(tl.TaskResult.Failed, 'Invalid output location');
                throw new Error('Invalid output location');
            }
            yield compile(inputFile, outputFile, style, enableVendorPrefixing, workingDirectorySass, workingDirectoryPrefixer);
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
