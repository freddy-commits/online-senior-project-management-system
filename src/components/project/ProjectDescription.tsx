import { FileText, Download } from 'lucide-react'

export function parseDescription(description: string) {
  if (!description) return { text: '', brief: null }
  const regex = /\[Attached Brief:\s*([^|]+)\|\s*([^\]]+)\]/
  const match = description.match(regex)
  if (match) {
    const text = description.replace(regex, '').trim()
    return {
      text,
      brief: {
        name: match[1].trim(),
        url: match[2].trim()
      }
    }
  }
  return { text: description, brief: null }
}

export default function ProjectDescription({ description, className = '' }: { description: string; className?: string }) {
  const { text, brief } = parseDescription(description)

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="whitespace-pre-wrap">{text}</p>
      {brief && (
        <div className="pt-1.5">
          <a
            href={brief.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-indigo-100 dark:border-indigo-900 transition-all shadow-sm cursor-pointer select-none active:scale-[0.98]"
            title={`View ${brief.name}`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-[250px]">View Brief: {brief.name}</span>
            <Download className="w-3.5 h-3.5 opacity-60 shrink-0 ml-1" />
          </a>
        </div>
      )}
    </div>
  )
}
