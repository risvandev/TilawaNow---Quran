const fs = require('fs');
const file = 'src/app/(protected)/settings/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Loading
code = code.replace(
  'if (data.notifications_enabled !== null) setNotifications(data.notifications_enabled);',
  'if (data.notifications_enabled !== null) { setNotifications(data.notifications_enabled); localStorage.setItem(\'site_notifications\', String(data.notifications_enabled)); }'
);

// 2. Local fallback loading
code = code.replace(
  'const savedNightMode = localStorage.getItem("nightMode") === "true";',
  'const savedNotifs = localStorage.getItem(\'site_notifications\');\\n    if (savedNotifs !== null) setNotifications(savedNotifs === \'true\');\\n\\n    const savedNightMode = localStorage.getItem("nightMode") === "true";'
);

// 3. Enabling Push Notifications
code = code.replace(
  'setNotifications(true);\n        updateProfileSetting(\'notifications_enabled\', true);',
  'setNotifications(true);\n        updateProfileSetting(\'notifications_enabled\', true);\n        localStorage.setItem(\'site_notifications\', \'true\');'
);

// 4. Denied Push Notifications
code = code.replace(
  'setNotifications(false);\n        toast({',
  'setNotifications(false);\n        localStorage.setItem(\'site_notifications\', \'false\');\n        toast({'
);

// 5. Disabled Push Notifications
code = code.replace(
  'setNotifications(false);\n      updateProfileSetting(\'notifications_enabled\', false);\n      toast({',
  'setNotifications(false);\n      updateProfileSetting(\'notifications_enabled\', false);\n      localStorage.setItem(\'site_notifications\', \'false\');\n      toast({'
);

fs.writeFileSync(file, code);
console.log("Done");
