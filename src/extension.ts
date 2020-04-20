import * as vscode from 'vscode';

// Activation
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('codejournal.addJournalEntry', async () => {

		// Setup, read config values and apply defaults.
		const now = new Date();
		const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
		const config = vscode.workspace.getConfiguration('codejournal');
		const cfFilePath: string | undefined = config.get('journalFileLocation');
		const cfLocaleUsed: string | undefined = config.get('journalHeadingLocale');
		const cfDebug: string | undefined = config.get('debugLog');
		if (!cfFilePath) {
			vscode.window.showErrorMessage("Journal file location not configured.", "Dismiss");
			return;
		}
		const filePath = cfFilePath;
		const localeUsed = cfLocaleUsed || 'en-US';
		const debugLog = cfDebug || false;
		const headingString = '# ' + now.toLocaleDateString(localeUsed, dateOptions);

		const outputChannel = vscode.window.createOutputChannel("Code Journal");
		if (debugLog) {
			outputChannel.show(true);
		} else {
			outputChannel.hide();
		}

		// TODO: Get current document context if requested via command parameter?

		// Convert file path to URI
		var openPath: vscode.Uri = vscode.Uri.file(filePath);

		// For creating the missing journal file, a workspace edit is needed.
		// Existing file is ignored, so one path is enough to cover both cases.
		var fileCreationEdit = new vscode.WorkspaceEdit();
		fileCreationEdit.createFile(openPath, {ignoreIfExists: true});
		await vscode.workspace.applyEdit(fileCreationEdit);
		vscode.workspace.openTextDocument(openPath).then((journalDocument: vscode.TextDocument) => {
			vscode.window.showTextDocument(journalDocument).then(async (textEditor: vscode.TextEditor) => {
				outputChannel.appendLine(`Lines in beginning ${journalDocument.lineCount}`);
				// Fold all blocks by default
				await vscode.commands.executeCommand('editor.foldAll');
				// Is document empty?
				if (journalDocument.lineCount>1) {
					// Is there matching heading already?
					outputChannel.appendLine('Document has content');
					let line = 0;
					let headingFound = false;
					outputChannel.appendLine('Looking forwards for current heading');
					while (line < journalDocument.lineCount) {
						if (journalDocument.lineAt(line).text === headingString) {
							outputChannel.appendLine(`Matching heading found at line ${line+1}`);
							headingFound = true;
							break;
						}
						line++;
					}
					if (!headingFound) {
						// No heading found
						outputChannel.appendLine('Matching heading not found');
						var insertPosition = journalDocument.lineAt(journalDocument.lineCount-1).range.end;
						var insertString = `\n\n${headingString}\n\n`;
						var cursorOffset = 5;
					} else {
						// Matching heading found
						await vscode.commands.executeCommand('editor.unfold', {selectionLines: [line]});
						outputChannel.appendLine('Looking forward for next heading');
						let scanLine = line+1;
						while (scanLine < journalDocument.lineCount && journalDocument.lineAt(scanLine).text[0] !== '#') {
							scanLine++;
						}
						if (scanLine === journalDocument.lineCount) {
							// Insert to end
							outputChannel.appendLine('Inserting to EOD');
							var insertPosition = journalDocument.lineAt(journalDocument.lineCount-1).range.end;
							var insertString = '\n\n';
							var cursorOffset = 2;
						} else {
							// Search for next heading
							outputChannel.appendLine(`Inserting in between, next heading found at line ${scanLine}`);
							var insertPosition = journalDocument.lineAt(scanLine).range.start;
							var insertString = '\n\n\n\n';
							var cursorOffset = 2;
						}
					}
				} else {
					var insertPosition = journalDocument.lineAt(0).range.start;
					var insertString = `${headingString}\n\n`;
					var cursorOffset = 2;
				}
				if (insertPosition.line > 0 && insertPosition.character === 0 && !journalDocument.lineAt(insertPosition.line).isEmptyOrWhitespace) {
					var lookBackLine = insertPosition.line - 1;
				} else {
					var lookBackLine = insertPosition.line;
				}
				outputChannel.appendLine(`Trimming empty lines from ${lookBackLine}`);
				while (journalDocument.lineAt(lookBackLine).isEmptyOrWhitespace && lookBackLine > 0) {
					lookBackLine--;
				}
				outputChannel.appendLine(`Looked back until ${lookBackLine}`);
				var replacePosition = journalDocument.lineAt(lookBackLine).range.end;
				var insertRange = new vscode.Range( replacePosition, insertPosition);
				await textEditor.edit((edit) => {
					edit.replace(insertRange, insertString);
				});
				outputChannel.appendLine(`Lines now ${journalDocument.lineCount}`);
				outputChannel.appendLine(`Positioning to line ${insertPosition.line + cursorOffset}`);
				var newPosition = replacePosition.translate(cursorOffset, 0);
				var newSelection = new vscode.Selection(newPosition, newPosition);
				textEditor.selection = newSelection;
			});
		}, (error: any) => {
			console.error(error);
		});
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
