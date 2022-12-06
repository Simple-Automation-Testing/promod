import { safeJSONstringify, isString, isObject, isPrimitive } from 'sat-utils';

const findRequiredPropertyValue = (capabilitiesDescriptor, propName) => {
  let userAgentValue;
  if (isObject(capabilitiesDescriptor)) {
    for (const key of Object.keys(capabilitiesDescriptor)) {
      if (key === propName) {
        userAgentValue = capabilitiesDescriptor[key];
        return userAgentValue;
      }
      if (isPrimitive(capabilitiesDescriptor[key])) {
        continue;
      }
      if (isObject(capabilitiesDescriptor[key])) {
        userAgentValue = findRequiredPropertyValue(capabilitiesDescriptor[key], propName);
        if (userAgentValue) return userAgentValue;
      }
    }
  }
  return userAgentValue;
};

const findUserAgentIfExists = (capabilitiesDescriptor) => {
  const userAgentPropName = 'userAgent';

  return findRequiredPropertyValue(capabilitiesDescriptor, userAgentPropName);
};

const findDownloadDefaultDir = (capabilitiesDescriptor) => {
  const defaultDownloadDirectoryName = 'default_directory';

  return findRequiredPropertyValue(capabilitiesDescriptor, defaultDownloadDirectoryName);
};

const findDeviceMetrics = (capabilitiesDescriptor) => {
  const deviceMetricsName = 'deviceMetrics';

  return findRequiredPropertyValue(capabilitiesDescriptor, deviceMetricsName);
};

const findViewPort = (capabilitiesDescriptor) => {
  const viewPortRg = /(?<=--window-size=)(\d+,\d+)/gim;
  const capabilitiesDescriptorStr: string = isString(capabilitiesDescriptor)
    ? capabilitiesDescriptor
    : safeJSONstringify(capabilitiesDescriptor);

  const matched = capabilitiesDescriptorStr.match(viewPortRg);

  if (matched) {
    const [width, height] = matched[0].split(',');

    return { width, height };
  }
};

export { findDeviceMetrics, findDownloadDefaultDir, findUserAgentIfExists, findViewPort };
