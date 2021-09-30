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
const spawn = require("await-spawn");
function compile(input, output, style, enableVendorPrefixing, workingDirectorySass, workingDirectoryPrefixer) {
    return __awaiter(this, void 0, void 0, function* () {
        //compile sass
        const options = {
            cwd: workingDirectorySass,
            shell: true
        };
        input = escapePath(input);
        output = escapePath(output);
        try {
            const sass = yield spawn("sass", [input, output, (style === 'compressed' ? '--style compressed' : '--style expanded'), '--no-source-map'], options);
            console.log(sass.toString());
            console.log(`compiled sass file ${input} to ${output}`);
        }
        catch (error) {
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
                const prefixer = yield spawn("autoprefixer-cli", ['-o', output, output], options2);
                console.log(prefixer.toString());
                console.log(`vendor prefixes added in ${output}`);
            }
            catch (error) {
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
    });
}
function escapePath(value) {
    return '"' + value + '"';
}
function installIfNotExists(path, tool) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            cwd: path + '\\node_modules\\.bin',
            shell: true
        };
        try {
            var sass = yield spawn(tool, ['--version'], options);
            console.log(`${tool} version using: ${sass.toString()}`);
        }
        catch (error) {
            console.log(`${tool} version not installed`);
            console.log(`installing latest version of ${tool}`);
            //create folder for npm package
            try {
                var mkdir = process.execSync('mkdir ' + escapePath(path));
            }
            catch (ex) {
                console.log(ex.toString());
            }
            const options2 = {
                cwd: path,
                shell: true
            };
            try {
                var install = yield spawn(`npm install`, ['--no-save', tool], options2);
                console.log(`latest ${tool} installed`);
                console.log(install.toString());
            }
            catch (error) {
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
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let inputFile = tl.getInput('inputFile');
            let outputFile = tl.getInput('outputFile');
            let style = tl.getInput('style');
            let enableVendorPrefixing = tl.getBoolInput('enableVendorPrefixing');
            let _baseWorkingDirectory = tl.getVariable('Agent.ToolsDirectory');
            // //tests: remove later
            // inputFile = 'D:\\Sources\\My Agent\\stylesheets\\_base.scss';
            // outputFile = 'Z:\\Sources\\My Agent\\core.css';
            // enableVendorPrefixing = true;
            // _baseWorkingDirectory = 'D:\\Sources\\MyAgent';
            // //tests
            let _workingDirectorySass = _baseWorkingDirectory + '\\sass\\node_modules\\.bin';
            let _workingDirectoryPrefixer = _baseWorkingDirectory + '\\autoprefixer\\node_modules\\.bin';
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
            yield installIfNotExists(_baseWorkingDirectory + '\\sass', 'sass');
            if (enableVendorPrefixing) {
                yield installIfNotExists(_baseWorkingDirectory + '\\autoprefixer', 'autoprefixer-cli');
            }
            yield compile(inputFile, outputFile, style, enableVendorPrefixing, _workingDirectorySass, _workingDirectoryPrefixer);
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
