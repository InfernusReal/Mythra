import Link from "next/link";

import type { VolumeWorkspaceRecord } from "../../modules/volumes/volume.types";

type VolumeWorkspaceShellProps = {
  workspace: VolumeWorkspaceRecord;
};

export function VolumeWorkspaceShell({ workspace }: VolumeWorkspaceShellProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "24px"
      }}
    >
      <header
        style={{
          display: "grid",
          gap: "8px"
        }}
      >
        <p style={{ margin: 0, color: "#607287", fontSize: "14px", fontWeight: 700, textTransform: "uppercase" }}>
          Volume Workspace
        </p>
        <h1 style={{ margin: 0, fontSize: "34px" }}>{workspace.volume.title}</h1>
        <p style={{ margin: 0, color: "#52637a", lineHeight: 1.6 }}>
          This shell confirms the volume exists, confirms which novel owns it, and provides a stable boundary for later
          milestone and world-building phases.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gap: "10px",
          backgroundColor: "#ffffff",
          border: "1px solid #d7dfeb",
          borderRadius: "18px",
          padding: "24px"
        }}
      >
        <strong>Parent novel</strong>
        <span>{workspace.novel.title}</span>
        <strong>Description</strong>
        <span>{workspace.volume.description ?? "No volume description is set yet."}</span>
        <Link href={`/volumes/${workspace.volume.id}/milestones`} style={{ color: "#153a61", fontWeight: 700 }}>
          Open milestone graph
        </Link>
        <Link href={`/novels/${workspace.novel.id}/volumes`} style={{ color: "#153a61", fontWeight: 700 }}>
          Return to volume list
        </Link>
      </section>
    </section>
  );
}
