import BackupImporter from "@/islands/BackupImporter.tsx";
import { define } from "@/utils/state.ts";

export default define.page(() => {
  return (
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <BackupImporter />
    </div>
  );
});
