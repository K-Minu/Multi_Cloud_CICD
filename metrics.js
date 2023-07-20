const {
  Registry,
  Counter,
  Gauge,
  Histogram,
  Summary,
  register,
} = require("prom-client");

const prometheus = () => {
  const registry = new Registry();
  const instances = {};

  const create = ({ type, name, help }) => {
    let instance;

    if (type === "counter") {
      instance = new Counter({ name, help });
    } else if (type === "gauge") {
      instance = new Gauge({ name, help });
    } else if (type === "histogram") {
      instance = new Histogram({ name, help });
    } else if (type === "summary") {
      instance = new Summary({ name, help });
    }

    if (instance) {
      registry.registerMetric(instance);
      instances[name] = { type, instance };
    }
  };

  const add = ({ name, data }) => {
    if (instances[name]) {
      const { type, instance } = instances[name];

      if (type === "counter") {
        instance.inc(data);
      } else if (type === "gauge") {
        instance.set(data);
      } else if (type === "histogram") {
        instance.observe(data);
      } else if (type === "summary") {
        instance.observe(data);
      }
    }
  };

  const get = async () => {
    return {
      metrics: await registry.metrics(),
      contentType: register.contentType,
    };
  };

  return { create, add, get };
};

const Prometheus = prometheus();
Prometheus.create({
  type: "counter",
  name: "counter",
  help: "random counter for test",
});
Prometheus.create({
  type: "gauge",
  name: "gauge",
  help: "random gauge for test",
});
Prometheus.create({
  type: "histogram",
  name: "histogram",
  help: "random histogram for test",
});
Prometheus.create({
  type: "summary",
  name: "summary",
  help: "random summary for test",
});

module.exports = {
  Prometheus,
};
