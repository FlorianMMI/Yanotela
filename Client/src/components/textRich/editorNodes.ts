/**
 * Configuration des nodes Lexical pour l'éditeur Yanotela
 */

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { ImageNode } from '@/components/flashnote/ImageNode';

export const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  ImageNode,
];
