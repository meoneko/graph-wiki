import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('crg.showBlastRadius', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const file = editor.document.uri.fsPath;
    vscode.window.showInformationMessage(`Blast radius requested for: ${file}`);
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  return;
}
