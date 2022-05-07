# logsync-bug
Reproduction for a bug in `@google-cloud/logging`

## Steps:
1. Deploy to App Engine Standard environment:

``` sh
gcloud app deploy app.yaml --project=<PROJECT_ID>
```

2. Go to [console.cloud.google.com/logs/](http://console.cloud.google.com/logs/)
to view output

## Expected:

Here are the first two calls to `log.write()` in `index.js`:

``` js
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
```

The expected output is something like: (irrelevant details removed)

``` json
[
  {
    "textPayload": "A text payload",
    "resource": {
      "type": "gae_app",
      "labels": {
        "version_id": "logsync-bug",
        "module_id": "default",
      }
    },
    "timestamp": "2022-05-06T23:13:23.002Z",
    "logName": "projects/REDACTED_PROJECT_ID/logs/my_log"
  },
  {
    "jsonPayload": {
      "message": "A JSON payload"
    },
    "resource": {
      "type": "gae_app",
      "labels": {
        "module_id": "default",
        "version_id": "logsync-bug"
      }
    },
    "timestamp": "2022-05-06T23:13:23.004Z",
    "logName": "projects/REDACTED_PROJECT_ID/logs/my_log",
    "receiveTimestamp": "2022-05-06T23:13:23.270510336Z"
  }
]
```

## Actual:

The actual output looks like the following: (irrelevant details removed)

``` json
[
  {
    "jsonPayload": {
      "message": "A text payload",
      "timestamp": "2022-05-06T23:13:23.002Z",
      "logName": "projects/REDACTED_PROJECT_ID/logs/my_log",
      "resource": {
        "type": "gae_app",
        "labels": {
          "module_id": "default",
          "version_id": "logsync-bug"
        }
      }
    },
    "resource": {
      "type": "gae_app",
      "labels": {
        "zone": "us3",
        "version_id": "logsync-bug",
        "module_id": "default",
        "project_id": "REDACTED_PROJECT_ID"
      }
    },
    "timestamp": "2022-05-06T23:13:23.004560Z",
    "logName": "projects/REDACTED_PROJECT_ID/logs/stdout",
  },
  {
    "jsonPayload": {
      "timestamp": "2022-05-06T23:13:23.004Z",
      "message": {
        "message": "A JSON payload"
      },
      "resource": {
        "labels": {
          "module_id": "default",
          "version_id": "logsync-bug"
        },
        "type": "gae_app"
      },
      "logName": "projects/REDACTED_PROJECT_ID/logs/my_log"
    },
    "resource": {
      "type": "gae_app",
      "labels": {
        "version_id": "logsync-bug",
        "module_id": "default",
        "project_id": "REDACTED_PROJECT_ID",
        "zone": "us3"
      }
    },
    "timestamp": "2022-05-06T23:13:23.005096Z",
    "logName": "projects/REDACTED_PROJECT_ID/logs/stdout",
  }
]
```

The full output can be seen in [downloaded-logs-20220506-191603.json](./downloaded-logs-20220506-191603.json)

## Fix

I've followed the instructions from the [README][], copied below. Notice that
it says to create an entry, passing metadata and a payload and then call
`log.write(entry)`:

[README]: https://github.com/googleapis/nodejs-logging/blob/main/README.md

```js
// Optional: Create and configure a client
const logging = new Logging();
await logging.setProjectId()
await logging.setDetectedResource()

// Create a LogSync transport, defaulting to `process.stdout`
const log = logging.logSync(logname);
const meta = { /* optional field overrides here */ };
const entry = log.entry(meta, 'Your log message');
log.write(entry);

// Syntax sugar for logging at a specific severity
log.alert(entry);
log.warning(entry);
```

However, in calls to `log.write(entry)`, it appears the final payload is being
populated with the entire `entry` object passed to `log.write()` and therefore
the `entry.metadata` isn't being applied at all.

So either the docs are wrong or this is a bug. To fix this it seems would
require either:

1. updating the README to show how to correctly create and write to a
   `log.logSync()`, or
2. fixing the behavior to match what's in the README.

