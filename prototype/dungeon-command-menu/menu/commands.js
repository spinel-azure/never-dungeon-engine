export const COMMANDS = Object.freeze([
  Object.freeze({ id: "status", label: "ステータス", implemented: true, href: "../status-screen/" }),
  Object.freeze({ id: "items", label: "アイテム", implemented: false }),
  Object.freeze({ id: "deck", label: "デッキ画面", implemented: true, href: "../card-system/card-deck/" }),
  Object.freeze({ id: "skills", label: "スキル", implemented: false }),
  Object.freeze({ id: "save", label: "セーブ", implemented: false }),
  Object.freeze({ id: "options", label: "オプション", implemented: true, view: "options" }),
]);
