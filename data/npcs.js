export const npcs = [
  {
    id: "NPC_01",
    name: "みかんにゃんこ",
    imageId: "NPC_01",
    image: "images/npc/NPC_01.avif",
    interactionType: "talk",
    dialogue: ["にゃ～？"],
    canCancel: true,
    retreatOnCancel: true
  }
];

export function getNpcById(id) {
  return npcs.find(npc => npc.id === id) || null;
}
