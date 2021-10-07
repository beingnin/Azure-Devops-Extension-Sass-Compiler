# Process Sass Files

This extension can be used to compile sass files and also add vendor prefixes to css files. In other words, the extension has the ability to compile scss input into css output and later add vendor specific prefixes to the output css. So the devops engineer gets all the functionalities required to process any sass file in release and build pipelines. The `Process-sass-files` task is compatible with both Azure Devops Services and Azure Devops Server(on-premise). 

## Prerequisites

`Node` and `npm` are required to be preinstalled in the machine where the Azure Pipelines agent resides. `Npm` is used by the task to install necessary softwares into the agent to process sass files. The `npm` command utility also need to be accessible globally in the machine i.e., the path where it is installed should be added to the `Path` system variable. This will be automatically be taken care of if you install node from the [node installer](https://nodejs.org/en/download/).

> **Note**: Currently this extension has been only tested in windows based Azure Pipelines agents.

## Configure

As already said you can use `Process-sass-files` with any kind of pipeline i.e., CI or CD pipelines. And that too with modern YAML code or classic UI. For the sake of demo I will be only using YAML configuration as I think figuring out YAML will help to configure with classic UI as well
|  **Argument**|  **Type**| **Description** |
|--|--|--|
|  inputFile|  string|  Location of the sass file which need to be compiled to css|
|  outputFile|  string|  Location where the compiled css to be kept|
|  style|  option|  Either `expanded` or `compressed`. If selected `compressed`, the compiled css will be minified. Otherwise left intact|
|  enableVendorPrefixing|  boolean|  If `true` vendor prefixes will be added to the compiled css|

## Example

```
- task: process-sass-files@0
  displayName: 'Compile sass'
  inputs:
    inputFile: '$(Build.SourcesDirectory)\Foo\Content\stylesheets\_base.scss'
    outputFile: '$(Build.SourcesDirectory)\Foo\Content\stylesheets\core.css'
    style: 'compressed'
    enableVendorPrefixing: true
```
## Tools used
 There are two tools used by `Process-sass-files` task internally to complete the functionalities. It will install the latest `sass` compiler and `autoprefixer-cli` from npm registry into the tools directory of the pipeline agent. Once installed the task will cache them for future uses. For this reason alone the pipeline agent should have access to the internet

<div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
