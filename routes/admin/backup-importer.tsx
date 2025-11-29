import { RouteConfig } from "fresh";
import BackupImporter from "@/islands/BackupImporter.tsx";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

export default function BackupImporterPage() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Backup Importer</title>
        <link rel="stylesheet" href="/backup-importer.css" />
      </head>
      <body>
        <BackupImporter />
      </body>
    </html>
  );
}
