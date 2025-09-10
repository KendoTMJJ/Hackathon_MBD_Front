import FlowCanvas from "../components/flow/FlowCanvas";

function BoardPage() {
  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#0f1115]">
      <div className="w-full h-full">
        <FlowCanvas />
      </div>
    </div>
  );
}

export default BoardPage;
