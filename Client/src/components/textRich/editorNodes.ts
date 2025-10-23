// @ts-ignore
import { ListItemNode, ListNode } from '@lexical/list';
// @ts-ignore
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
// @ts-ignore
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { FontSizeNode } from './FontSizeNode';
import { ColorNode } from './ColorNode';
import { StyledTextNode } from './StyledTextNode';

// @ts-ignore - TypeScript excessive stack depth with Lexical node types
export const editorNodes = [
    ListNode,
    ListItemNode,
    HeadingNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    FontSizeNode,
    ColorNode,
    StyledTextNode,
];
