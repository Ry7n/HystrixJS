# Changelog

## Unreleased

### Changed

* This project has new maintainers and is now hosted in GitHub
* Relicensed using the MIT license (#6)

### Fixed

* Fixed an issue causing incorrect timings in New Relic (#5)

### Security

* Updated several devDependencies that failed security audit (#1)

## 0.2.0 (2017-05-25)

### Added

* add cumulative sum to the metrics (thank you [dimichgh](https://bitbucket.org/dimichgh/)
* add metrics for successful and failed executions of fallback (thank you [dimichgh](https://bitbucket.org/dimichgh/)

### Changed

* Removed explicit dependency to rx and added peer dependency to rxjs(5.0.0). If your project is using hystrix stream feature, it will now have to add an explicit dependency to rx or rxjs. (thank you [jgorman](https://bitbucket.org/jgorman/))

To migrate you need to add an explicit dependency to rx in your project

### Fixed

* hystrix stream enforces the update of rolling window, preventing showing the same data, if there are not requests
