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
const semver = require("semver");
const spawn = require("await-spawn");
const regex = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/g;
function compile(input, output, style, enableVendorPrefixing, generateSourceMap, workingDirectorySass, workingDirectoryPrefixer) {
    return __awaiter(this, void 0, void 0, function* () {
        //compile sass
        const options = {
            cwd: workingDirectorySass,
            shell: true
        };
        input = escapePath(input);
        output = escapePath(output);
        try {
            const sass = yield spawn("sass", [input, output, (style === 'compressed' ? '--style compressed' : '--style expanded'), generateSourceMap ? '' : '--no-source-map'], options);
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
function installIfNotExists(path, tool, version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!version) {
            version = 'latest';
        }
        const options = {
            cwd: path + '\\node_modules\\.bin',
            shell: true
        };
        try {
            let versionFinder = yield spawn('npm', ['list', tool], options);
            let current = versionFinder.toString().match(regex)[0];
            let getVersions = yield spawn('npm', ['view', tool, 'versions'], options);
            let allVersions = getVersions.toString().match(regex);
            version = semver.maxSatisfying(allVersions, version === 'latest' ? '' : version);
            console.log(`The current installed version for ${tool} is ${current}`);
            console.log(`The highest available version wrt the provided version range for ${tool} is ${version}`);
            if (!semver.eq(current, version)) {
                throw new Error('Current installed version doesn\'t match the latest specified version range');
            }
        }
        catch (error) {
            console.log(`installing ${version} version of ${tool}`);
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
                var install = yield spawn(`npm install ${tool}@${version}`, ['--no-save'], options2);
                console.log(`${tool}@${version} installed`);
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
            let sassVersion = tl.getInput('sassVersion');
            let autoprefixerVersion = tl.getInput('autoprefixerVersion');
            let style = tl.getInput('style');
            let enableVendorPrefixing = tl.getBoolInput('enableVendorPrefixing');
            let generateSourceMap = tl.getBoolInput('generateSourceMap');
            let _baseWorkingDirectory = tl.getVariable('Agent.ToolsDirectory');
            //tests: remove later
            inputFile = 'D:\\Sample\\sample.scss';
            outputFile = 'D:\\Sample\\sample.css';
            enableVendorPrefixing = true;
            _baseWorkingDirectory = 'D:\\Sources\\My Agent';
            sassVersion = '1.39.x';
            style = 'compressed';
            generateSourceMap = false;
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
            yield installIfNotExists(_baseWorkingDirectory + '\\sass', 'sass', sassVersion);
            if (enableVendorPrefixing) {
                yield installIfNotExists(_baseWorkingDirectory + '\\autoprefixer', 'autoprefixer-cli', autoprefixerVersion);
            }
            yield compile(inputFile, outputFile, style, enableVendorPrefixing, generateSourceMap, _workingDirectorySass, _workingDirectoryPrefixer);
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    });
}
run();
