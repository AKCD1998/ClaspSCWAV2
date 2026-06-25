const externalTarget = "_blank";

function readEnv(name, fallback = "") {
  return String(import.meta.env[name] || fallback).trim();
}

const title = readEnv("VITE_APP_TITLE", "CiPData Lookup");
const subtitle = readEnv(
  "VITE_APP_SUBTITLE",
  "เมนูเริ่มต้นสำหรับ migration ออกจาก Google Apps Script",
);

const items = [
  {
    id: "pos",
    title: "จำหน่ายยาโดยเภสัชกร",
    description: "เปิดระบบ POS ที่เชื่อมกับ workflow เดิมของเภสัชกร",
    href: readEnv(
      "VITE_LINK_POS_APP",
      "https://script.google.com/macros/s/AKfycbxj11P8kv2Ps_cPUTdO_4ge-Luj11ucFgNB099kXI-XFYheYrQPe5Q1erTDCDxE137c/exec",
    ),
    target: externalTarget,
    accent: "cyan",
  },
  {
    id: "lookup",
    title: "สำหรับกรอกข้อมูล",
    description: "ปลายทางชั่วคราวสำหรับ lookup workflow ระหว่าง migration",
    href: readEnv("VITE_LINK_LOOKUP", "https://sc-cipdata-lookup-web.onrender.com/"),
    target: externalTarget,
    accent: "emerald",
  },
  {
    id: "ci-upload",
    title: "อัปโหลดเอกสารงบ Ci",
    description: "เปิด workflow เดิมสำหรับอัปโหลดเอกสารงบ Ci",
    href: readEnv(
      "VITE_LINK_CI_UPLOAD",
      "https://script.google.com/macros/s/AKfycbzFhKGsmuEed-uX8hYEHUAcLeEDqIAm1FyklERM0_lpFV69O3TFaRLfgoxNHI8vd1rz/exec",
    ),
    target: externalTarget,
    accent: "amber",
  },
  {
    id: "inbound",
    title: "รายการสินค้ารับเข้าคลัง",
    description: "เปิดปลายทาง inventory ภายนอก โดยเปลี่ยน URL ผ่าน env ได้",
    href: readEnv("VITE_LINK_INBOUND_INVENTORY", "https://sc-stockday-ordering.onrender.com/"),
    target: externalTarget,
    accent: "blue",
  },
  {
    id: "rx1011",
    title: "บันทึกรับเข้า/โอน/ขาย (Rx1011)",
    description: "เปิดระบบ Rx1011 ภายนอกแบบ config-driven แทน hardcoded ใน GAS",
    href: readEnv("VITE_LINK_RX1011", "https://akcd1998.github.io/RepWeb1011/#/"),
    target: externalTarget,
    accent: "violet",
  },
];

export const navigationConfig = {
  title,
  subtitle,
  items,
};
