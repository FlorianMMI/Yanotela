import React from "react";
// @ts-ignore
import { LexicalComposer } from "@lexical/react/LexicalComposer";
// @ts-ignore
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
// @ts-ignore
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
// @ts-ignore
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
// @ts-ignore
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, $getSelection } from "lexical";
import { HeadingToolbar } from "./Toolbar/HeadingToolbar";
import { BoldToolbar } from "./Toolbar/BoldToolbar";
import { ItalicToolbar } from "./Toolbar/ItalicToolbar";
import { UnderlineToolbar } from "./Toolbar/UnderlineToolbar";
import { ListToolbar } from "./Toolbar/ListToolbar";
import { UndoRedoToolbar } from "./Toolbar/UndoRedoToolbar";
import { CodeToolbar } from "./Toolbar/CodeToolbar";

type TextRichProps = {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
};

const theme = {
    // Optionally customize Lexical theme here
};

export default function TextRich({
    value = "",
    onChange,
    placeholder = "Écrivez votre note...",
    readOnly = false,
}: TextRichProps) {
    const initialConfig = {
        namespace: "YanotelaRichText",
        theme,
        onError(error: Error) {
            // eslint-disable-next-line no-console
            console.error(error);
        },
        editable: !readOnly,
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="relative border rounded-lg bg-white">
                {!readOnly && (
                    <div className="flex gap-2 px-2 py-1 border-b bg-gray-50">
                        <HeadingToolbar />
                        <BoldToolbar />
                        <ItalicToolbar />
                        <UnderlineToolbar />
                        <ListToolbar />
                        <CodeToolbar />
                        <UndoRedoToolbar />
                    </div>
                )}
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className={`min-h-[120px] p-3 outline-none ${readOnly ? "bg-gray-100" : ""}`}
                            spellCheck
                            readOnly={readOnly}
                            data-testid="rich-text-editor"
                        />
                    }
                    placeholder={
                        <div className="absolute left-4 top-4 pointer-events-none text-gray-400 select-none">
                            {placeholder}
                        </div>
                    }
                />
                <HistoryPlugin />
                <OnChangePlugin
                    onChange={(editorState: any) => {
                        if (onChange) {
                            editorState.read(() => {
                                const json = JSON.stringify(editorState.toJSON());
                                onChange(json);
                            });
                        }
                    }}
                />
            </div>
        </LexicalComposer>
    );
}