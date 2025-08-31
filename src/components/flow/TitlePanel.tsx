import { Panel } from "@xyflow/react";

type Props = {
  title: string;
  onChangeTitle: (v: string) => void;
  isDraft: boolean;
};

export default function TitlePanel({ title, onChangeTitle, isDraft }: Props) {
  return (
    <Panel position="top-left">
      <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#0f1115]/90 p-2">
        <input
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Sin título"
          className="w-64 rounded-md bg-transparent px-2 py-1 text-white outline-none placeholder:text-white/40"
        />
        {isDraft && (
          <span
            className="ml-1 inline-block h-2 w-2 rounded-full bg-yellow-400"
            title="Borrador: aún no guardado"
          />
        )}
      </div>
    </Panel>
  );
}
