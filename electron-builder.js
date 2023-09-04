/**
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
    appId: "com.emiliobool.tainybot",
    productName: "tainybot",
    publish: [
        {
            provider: "github",
            owner: "emiliobool",
            repo: "tainybot",
        },
    ],
    appId: "com.emiliobool.tainybot",
    productName: "tainybot",
    asar: true,
    icon: "resources/icon.ico",
    directories: {
        output: "release/${version}",
        buildResources: "resources",
    },
    files: ["dist-electron", "dist", "resources/icon.ico"],
    mac: {
        artifactName: "${productName}_${version}.${ext}",
        target: ["dmg"],
    },
    win: {
        target: [
            {
                target: "nsis",
                arch: ["x64"],
            },
        ],
        icon: "resources/icon.ico",
        artifactName: "${productName}_${version}.${ext}",
        publisherName: "Emilio Bool",
        certificateFile: "certificate.pfx",
        "certificatePassword": process.env.CERT_PASSWORD,
        rfc3161TimeStampServer: "http://timestamp.digicert.com",
        signAndEditExecutable: true,
        signDlls: true,
    },
    nsis: {
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        deleteAppDataOnUninstall: false,
    },
}
