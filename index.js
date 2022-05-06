const { Logging } = require("@google-cloud/logging");

const log = new Logging({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
}).logSync("my_log");

const metadata = {
  resource: {
    type: "gae_app",
    labels: {
      module_id: process.env.GAE_SERVICE,
      version_id: process.env.GAE_VERSION,
    },
  },
};

log.write(log.entry(metadata, "A text payload"));
log.write(log.entry(metadata, { message: "A JSON payload" }));

log.emergency(log.entry(metadata, "A text payload, severity=EMERGENCY"));
log.alert(log.entry(metadata, "A text payload, severity=ALERT"));
log.critical(log.entry(metadata, "A text payload, severity=CRITICAL"));
log.error(log.entry(metadata, "A text payload, severity=ERROR"));
log.warning(log.entry(metadata, "A text payload, severity=WARNING"));
log.notice(log.entry(metadata, "A text payload, severity=NOTICE"));
log.info(log.entry(metadata, "A text payload, severity=INFO"));
log.debug(log.entry(metadata, "A text payload, severity=DEBUG"));
