"use client";

type SceneFormProps = {
  outline: string;
  explanation: string;
  isSubmitting: boolean;
  isEditing: boolean;
  statusMessage: string;
  onOutlineChange: (value: string) => void;
  onExplanationChange: (value: string) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
};

export function SceneForm({
  outline,
  explanation,
  isSubmitting,
  isEditing,
  statusMessage,
  onOutlineChange,
  onExplanationChange,
  onSubmit,
  onCancelEdit
}: SceneFormProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "12px",
        backgroundColor: "#ffffff",
        border: "1px solid #d7dfeb",
        borderRadius: "18px",
        padding: "24px"
      }}
    >
      <h2 style={{ margin: 0, fontSize: "20px" }}>{isEditing ? "Edit Scene" : "Create Scene"}</h2>
      <textarea
        value={outline}
        onChange={(event) => onOutlineChange(event.target.value)}
        placeholder="Scene outline"
        rows={4}
        style={{
          padding: "14px 16px",
          borderRadius: "12px",
          border: "1px solid #c1ccdd",
          fontSize: "16px",
          resize: "vertical"
        }}
      />
      <textarea
        value={explanation}
        onChange={(event) => onExplanationChange(event.target.value)}
        placeholder="Explain what happens in this scene"
        rows={5}
        style={{
          padding: "14px 16px",
          borderRadius: "12px",
          border: "1px solid #c1ccdd",
          fontSize: "16px",
          resize: "vertical"
        }}
      />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          style={{
            border: "none",
            borderRadius: "999px",
            backgroundColor: "#1a466f",
            color: "#ffffff",
            padding: "14px 20px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Scene" : "Create Scene"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              borderRadius: "999px",
              border: "1px solid #c1ccdd",
              backgroundColor: "#ffffff",
              color: "#1a466f",
              padding: "14px 20px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Cancel Edit
          </button>
        ) : null}
      </div>
      <p style={{ margin: 0, color: "#52637a" }}>{statusMessage}</p>
    </section>
  );
}
