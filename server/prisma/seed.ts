import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cards = [
  // workplace
  {
    name: '因果律反弹御守',
    rarity: 'SSR',
    mode: 'workplace',
    description: '装备后自动反弹一切甩锅、PUA和无效会议。使用者将获得长达24小时的职场和平光环。',
    emoji: '🛡️',
  },
  {
    name: '大厂黑话过滤器',
    rarity: 'SR',
    mode: 'workplace',
    description: '自动将"赋能""抓手""闭环""对齐"等黑话翻译成人话，节省80%的理解时间。',
    emoji: '🔍',
  },
  {
    name: '疯狂星期四V我50',
    rarity: 'R',
    mode: 'workplace',
    description: '每周四自动向同事群发"V我50"请求，有一定概率真的收到红包。',
    emoji: '🍗',
  },
  {
    name: '摆烂便利贴',
    rarity: 'N',
    mode: 'workplace',
    description: '一张写着"关我屁事"的便利贴。贴在显示器上可获得微弱的心理安慰。',
    emoji: '📝',
  },
  // academic
  {
    name: '导师已读乱回结界',
    rarity: 'SSR',
    mode: 'academic',
    description: '展开后导师的修改意见自动变成"挺好的，继续加油"。论文一次过的概率提升300%。',
    emoji: '🔮',
  },
  {
    name: 'DDL逆转时钟',
    rarity: 'SR',
    mode: 'academic',
    description: '将DDL逆转24小时。注意：每次使用后需要充电7天，请谨慎选择时机。',
    emoji: '⏰',
  },
  {
    name: '降重符',
    rarity: 'R',
    mode: 'academic',
    description: '贴在论文封面，查重率自动下降15%。副作用：可能把"机器学习"降重成"机械学习"。',
    emoji: '📜',
  },
  {
    name: '学术垃圾袋',
    rarity: 'N',
    mode: 'academic',
    description: '容量无限的垃圾袋，可装下你所有写废的论文草稿。自带除臭功能。',
    emoji: '🗑️',
  },
];

async function main() {
  console.log('🌱 Seeding cards...');

  for (const card of cards) {
    const existing = await prisma.card.findFirst({
      where: { name: card.name, mode: card.mode },
    });
    if (!existing) {
      await prisma.card.create({ data: card });
      console.log(`  ✅ ${card.rarity} ${card.name}`);
    } else {
      console.log(`  ⏭️  Skipped (exists): ${card.name}`);
    }
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
