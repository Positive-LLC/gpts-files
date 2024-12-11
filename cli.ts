import { Command } from "@cliffy/command";
import { Table } from "@cliffy/table";
import { colors } from "@cliffy/ansi/colors";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load environment variables
config({ export: true });

interface FileResponse {
  id: string;
  filename: string;
  bytes: number;
  created_at: number;
  purpose: string;
}

class GPTFilesClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "API request failed");
    }

    return response.json();
  }

  async uploadFile(filePath: string, assistantId: string, newFileName?: string) {
    const formData = new FormData();
    const file = await Deno.readFile(filePath);
    const originalFilename = filePath.split("/").pop();
    const uploadFilename = newFileName || originalFilename;

    formData.append("purpose", "assistants");
    formData.append("file", new Blob([file]), uploadFilename);

    const fileResponse = await this.request("/files", {
      method: "POST",
      body: formData,
    });

    await this.request(`/assistants/${assistantId}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v1",
      },
      body: JSON.stringify({ file_id: fileResponse.id }),
    });

    return fileResponse;
  }

  async listFiles(assistantId: string) {
    return await this.request(`/assistants/${assistantId}/files`, {
      headers: {
        "OpenAI-Beta": "assistants=v1",
      },
    });
  }

  async deleteFile(fileId: string, assistantId: string) {
    await this.request(`/assistants/${assistantId}/files/${fileId}`, {
      method: "DELETE",
      headers: {
        "OpenAI-Beta": "assistants=v1",
      },
    });

    return await this.request(`/files/${fileId}`, {
      method: "DELETE",
    });
  }
}

await new Command()
  .name("gpts-files")
  .version("1.0.0")
  .description("Manage files for OpenAI GPTs")
  .env("OPENAI_API_KEY=<value:string>", "OpenAI API key")
  .env("OPENAI_GPTS_ID=<value:string>", "OpenAI GPTs ID")
  .command("upload", "Upload a file to a GPTs")
  .option("-n, --new-name <name:string>", "New filename for the upload (optional)")
  .arguments("<file:string>")
  .action(async (options, filePath) => {
    try {
      const client = new GPTFilesClient(Deno.env.get("OPENAI_API_KEY")!);
      const response = await client.uploadFile(
        filePath,
        Deno.env.get("OPENAI_GPTS_ID")!,
        options.newName,
      );
      console.log(colors.green("✓"), "File uploaded successfully:", response.id);
    } catch (error: unknown) {
      console.error(colors.red("✗"), "Error:", error);
      Deno.exit(1);
    }
  })
  .command("list", "List all files attached to a GPTs")
  .action(async () => {
    try {
      const client = new GPTFilesClient(Deno.env.get("OPENAI_API_KEY")!);
      const response = await client.listFiles(Deno.env.get("OPENAI_GPTS_ID")!);

      const table = new Table()
        .header(["ID", "Filename", "Size", "Created"])
        .body(
          response.data.map((file: FileResponse) => [
            file.id,
            file.filename,
            `${(file.bytes / 1024).toFixed(2)} KB`,
            new Date(file.created_at * 1000).toLocaleString(),
          ])
        );

      table.render();
    } catch (error: unknown) {
      console.error(colors.red("✗"), "Error:", error);
      Deno.exit(1);
    }
  })
  .command("delete", "Remove a file from a GPTs")
  .arguments("<fileId:string>")
  .action(async (_, fileId) => {
    try {
      const client = new GPTFilesClient(Deno.env.get("OPENAI_API_KEY")!);
      await client.deleteFile(fileId, Deno.env.get("OPENAI_GPTS_ID")!);
      console.log(colors.green("✓"), "File deleted successfully");
    } catch (error: unknown) {
      console.error(colors.red("✗"), "Error:", error);
      Deno.exit(1);
    }
  })
  .parse(Deno.args);