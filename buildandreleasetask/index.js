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
        try {
            const sass = yield spawn("sass", [input, output, (style === 'compressed' ? '--style compressed' : '--style expanded'), '--no-source-map'], options);
            console.log(sass.toString());
            console.log(`compiled sass file ${input} to ${output}`);
        }
        catch (error) {
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
                const prefixer = yield spawn("autoprefixer-cli", ['-o', output, output], options2);
                console.log(prefixer.toString());
                console.log(`vendor prefixes added in ${output}`);
            }
            catch (error) {
                console.log(error.stdout.toString());
                if (error.errorno !== 0) {
                    console.error('vendor prefixing thrown error');
                    throw new Error(error.stderr.toString());
                }
            }
        }
    });
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
                var mkdir = process.execSync('mkdir ' + path);
            }
            catch (ex) {
                console.log(ex);
            }
            const options2 = {
                cwd: path,
                shell: true
            };
            try {
                var install = yield spawn(`npm install ${tool}`, options2);
                console.log(`latest ${tool} installed`);
                console.log(install.toString());
            }
            catch (error) {
                console.log(`error occurred while trying to install ${tool}`);
                console.log(error);
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
            const _baseWorkingDirectory = '$(Agent.ToolsDirectory)';
            const _workingDirectorySass = _baseWorkingDirectory + '\\sass\\node_modules\\.bin';
            const _workingDirectoryPrefixer = _baseWorkingDirectory + '\\autoprefixer\\node_modules\\.bin';
            // //tests: remove later
            // inputFile = 'D:\\Sources\\OS\\Agent\\stylesheets\\_base.scss';
            // outputFile = 'D:\\Sources\\OS\\Agent\\stylesheets\\core.css';
            // enableVendorPrefixing=true;
            // //tests
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
