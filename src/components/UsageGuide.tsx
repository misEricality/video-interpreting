import { Drawer } from './ui/Drawer';
import { useAppStore } from '@/store/useAppStore';
import {
  Link2,
  KeyRound,
  Cookie,
  ListChecks,
  Sparkles,
  Subtitles,
  MessageCircleQuestion,
  AlertTriangle,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { VENDORS } from '@/config/vendors';

/**
 * 「使用指南」抽屉 - 给首次使用 / 遇到问题的用户一个完整说明。
 * 涵盖:基本流程、API Key 获取、SESSDATA 获取、字幕要求、常见问题。
 */
export function UsageGuide() {
  const open = useAppStore((s) => s.drawer.usage);
  const setDrawer = useAppStore((s) => s.setDrawer);

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => setDrawer('usage', v)}
      title="使用指南"
      description="5 分钟了解这个工具怎么用"
      side="right"
      width="w-full sm:max-w-lg"
    >
      <div className="space-y-6 text-sm text-[var(--ink-muted)] leading-relaxed">
        {/* 一句话介绍 */}
        <p>
          这个工具帮你用 AI <strong>总结 B 站视频内容</strong>,并定位与你的关注点相关的
          <strong> 时间段</strong>(可一键跳转 B 站)。
        </p>

        {/* Step 1 - API Key */}
        <Section
          icon={<KeyRound className="h-4 w-4 text-brand-500" />}
          title="1. 选择 AI 厂商 + 配置 Key"
        >
          <p>这是使用 AI 的「钥匙」,每个用户用自己的 Key,本站不存储、不中转。</p>
          <p className="mt-2 mb-1.5 text-[var(--ink)] font-medium flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-brand-500" />
            支持的厂商
          </p>
          <ul className="space-y-1 pl-4 list-disc">
            {VENDORS.map((v) => (
              <li key={v.id}>
                <a
                  href={v.keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:underline"
                >
                  {v.name}
                </a>
                <span className="text-[var(--ink-subtle)] text-xs"> · {v.description}</span>
              </li>
            ))}
          </ul>
          <ol className="mt-3 space-y-1.5 pl-4 list-decimal">
            <li>在任一厂商控制台注册/登录,创建一个 API Key</li>
            <li>回到本站 → 右上角 ⚙ 设置 → 「AI 厂商」选你注册的厂商</li>
            <li>base URL 和模型会自动填好(也可手动改)</li>
            <li>把 Key 粘到「API Key」框,旁边有「去 XX 控制台申请 Key」直达链接</li>
            <li>勾选「记住 API Key」,下次自动填充(本机加密存储)</li>
          </ol>
        </Section>

        {/* Step 2 - 输入链接 */}
        <Section
          icon={<Link2 className="h-4 w-4 text-brand-500" />}
          title="2. 粘贴视频链接"
        >
          <p>
            复制 B 站视频链接(包含 BV 号即可),粘到输入框。{' '}
            <strong>失焦时</strong>会自动简化,去掉分享时附加的追踪参数
            (如 <code className="bg-[var(--bg-soft)] px-1 rounded">?spm_id_from=...</code>、
            <code className="bg-[var(--bg-soft)] px-1 rounded">?p=5</code> 等)。
          </p>
          <p className="mt-1.5">
            也支持只贴 BV 号(例如 <code className="bg-[var(--bg-soft)] px-1 rounded">BV1uv4y1o7Lx</code>)。
          </p>
        </Section>

        {/* Step 3 - 关注点 */}
        <Section
          icon={<MessageCircleQuestion className="h-4 w-4 text-brand-500" />}
          title="3. (可选)写你的关注点"
        >
          <p>留空 = 总结视频主要内容。</p>
          <p className="mt-1.5">
            例:<em>「讲解了哪些英语学习方法?有没有提到背单词的技巧?」</em>
          </p>
        </Section>

        {/* Step 4 - 字幕要求 */}
        <Section
          icon={<Subtitles className="h-4 w-4 text-brand-500" />}
          title="4. 视频必须带字幕(核心限制)"
        >
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <span>
              本工具 <strong>只能解读带字幕的视频</strong>(人工 / AI / CC 均可)。无字幕视频会直接提示「很抱歉,该视频无法解读」。
            </span>
          </div>
          <p className="mt-2.5">怎么判断视频有没有字幕:</p>
          <ol className="mt-1.5 space-y-1.5 pl-4 list-decimal">
            <li>在 B 站打开视频页面</li>
            <li>看播放器底部右下角,有没有 <strong>CC / 字幕</strong> 按钮</li>
            <li>点开后能选语言轨 → 有字幕;没有按钮 → 没字幕</li>
          </ol>
          <p className="mt-2.5 text-xs text-[var(--ink-subtle)]">
            💡 字幕稳定的类型:官方纪录片、知名 UP 原创(BBC、罗翔、影视飓风、李永乐等)、TED 官方搬运。
          </p>
        </Section>

        {/* Step 5 - SESSDATA */}
        <Section
          icon={<Cookie className="h-4 w-4 text-brand-500" />}
          title="5. (可选)填 SESSDATA 解锁更多视频"
        >
          <p>对<strong>登录 / 充电 / 会员限定</strong>视频,需要 B 站登录态才能拿到字幕。</p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-[var(--ink)] font-medium hover:underline">
              如何获取 SESSDATA?
            </summary>
            <ol className="mt-2 space-y-1.5 pl-4 list-decimal">
              <li>浏览器打开 bilibili.com 并<strong>登录</strong>你的账号</li>
              <li>按 F12 打开 DevTools</li>
              <li>切到 <strong>Application</strong> 标签</li>
              <li>左侧 Cookies → <code className="bg-[var(--bg-soft)] px-1 rounded">https://www.bilibili.com</code></li>
              <li>找到 <code className="bg-[var(--bg-soft)] px-1 rounded">SESSDATA</code> 这一行,双击复制它的 Value(通常以 <code className="bg-[var(--bg-soft)] px-1 rounded">xxx%2C</code> 开头)</li>
              <li>粘到本站设置 → 「B 站 SESSDATA」→ 保存</li>
            </ol>
            <p className="mt-2 text-[var(--ink-subtle)]">
              💡 快速方法:DevTools → Console 标签,粘贴运行<br />
              <code className="block bg-[var(--bg-soft)] px-2 py-1 rounded mt-1 select-all">
                document.cookie.match(/SESSDATA=([^;]+)/)?.[1]
              </code>
              把输出的值复制下来即可。
            </p>
          </details>
        </Section>

        {/* Step 6 - 看结果 */}
        <Section
          icon={<Sparkles className="h-4 w-4 text-brand-500" />}
          title="6. 看结果 + 追问"
        >
          <p>AI 会输出两部分:</p>
          <ul className="mt-1.5 space-y-1 pl-4 list-disc">
            <li><strong>主要内容总结</strong>:整段视频讲了什么</li>
            <li><strong>相关时间片段</strong>:你关注点出现的具体时间点(点击跳转 B 站)</li>
          </ul>
          <p className="mt-2.5">
            结果下方有 <strong>对话输入框</strong>,可以继续追问 AI(如「第二段什么意思?」),AI 会基于字幕回答。
          </p>
        </Section>

        {/* 常见问题 */}
        <Section
          icon={<ListChecks className="h-4 w-4 text-brand-500" />}
          title="常见问题"
        >
          <QA q="提示「该视频无法解读」?">
            视频没字幕。换有 CC 按钮的视频,或在设置里填 SESSDATA 重试。
          </QA>
          <QA q="AI 解读超时 / 失败?">
            检查 API Key 余额、Base URL 是否正确。可关闭「分块 Map-Reduce」试试。
          </QA>
          <QA q="「分块 Map-Reduce」是啥?">
            长视频(&gt; 8 分钟)会被切成小段分别解读再合并,避免超出模型 token 上限。短视频可以关掉。
          </QA>
          <QA q="需要翻墙才能用吗?">
            是的,当前部署在 Vercel,国内直连不稳定,需要科学上网才能正常访问。
          </QA>
        </Section>

        {/* 隐私 */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
          <div>
            <strong className="text-[var(--ink)]">隐私</strong>:所有数据(API Key、对话历史、SESSDATA)
            仅保存在你的浏览器,本应用不会上传到任何服务器。退出前可在「设置 → 清空所有数据」一键清除。
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
        {icon}
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-[var(--ink)] font-medium hover:underline select-none">
        Q: {q}
      </summary>
      <p className="mt-1.5 text-[var(--ink-muted)] pl-1">{children}</p>
    </details>
  );
}