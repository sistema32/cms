import { ClassicEditor } from "@ckeditor/ckeditor5-editor-classic/src/classiceditor.js";
import { Essentials } from "@ckeditor/ckeditor5-essentials/src/essentials.js";
import { Paragraph } from "@ckeditor/ckeditor5-paragraph/src/paragraph.js";
import { Heading } from "@ckeditor/ckeditor5-heading/src/heading.js";
import { Bold } from "@ckeditor/ckeditor5-basic-styles/src/bold.js";
import { Italic } from "@ckeditor/ckeditor5-basic-styles/src/italic.js";
import { Underline } from "@ckeditor/ckeditor5-basic-styles/src/underline.js";
import { Strikethrough } from "@ckeditor/ckeditor5-basic-styles/src/strikethrough.js";
import { Link } from "@ckeditor/ckeditor5-link/src/link.js";
import { BlockQuote } from "@ckeditor/ckeditor5-block-quote/src/blockquote.js";
import { List } from "@ckeditor/ckeditor5-list/src/list.js";
import { TodoList } from "@ckeditor/ckeditor5-list/src/todolist.js";
import { Font } from "@ckeditor/ckeditor5-font/src/font.js";
import { Alignment } from "@ckeditor/ckeditor5-alignment/src/alignment.js";
import { HorizontalLine } from "@ckeditor/ckeditor5-horizontal-line/src/horizontalline.js";
import { Table } from "@ckeditor/ckeditor5-table/src/table.js";
import { TableToolbar } from "@ckeditor/ckeditor5-table/src/tabletoolbar.js";
import { TableProperties } from "@ckeditor/ckeditor5-table/src/tableproperties.js";
import { TableCellProperties } from "@ckeditor/ckeditor5-table/src/tablecellproperties.js";
import { Image } from "@ckeditor/ckeditor5-image/src/image.js";
import { ImageToolbar } from "@ckeditor/ckeditor5-image/src/imagetoolbar.js";
import { ImageCaption } from "@ckeditor/ckeditor5-image/src/imagecaption.js";
import { ImageStyle } from "@ckeditor/ckeditor5-image/src/imagestyle.js";
import { ImageResize } from "@ckeditor/ckeditor5-image/src/imageresize.js";
import { ImageUpload } from "@ckeditor/ckeditor5-image/src/imageupload.js";
import { PasteFromOffice } from "@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice.js";
import { Autoformat } from "@ckeditor/ckeditor5-autoformat/src/autoformat.js";
import { Highlight } from "@ckeditor/ckeditor5-highlight/src/highlight.js";
ClassicEditor.builtinPlugins = [
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  BlockQuote,
  List,
  TodoList,
  Font,
  Alignment,
  HorizontalLine,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageUpload,
  PasteFromOffice,
  Autoformat,
  Highlight,
];

ClassicEditor.defaultConfig = {
  toolbar: {
    items: [
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "highlight",
      "|",
      "fontFamily",
      "fontSize",
      "fontColor",
      "fontBackgroundColor",
      "|",
      "alignment",
      "|",
      "link",
      "bulletedList",
      "numberedList",
      "todoList",
      "|",
      "blockQuote",
      "horizontalLine",
      "|",
      "insertTable",
      "imageUpload",
    ],
    shouldNotGroupWhenFull: true,
  },
  fontFamily: {
    options: [
      "default",
      "Inter, sans-serif",
      "Roboto, sans-serif",
      "Merriweather, serif",
      "Playfair Display, serif",
      "Fira Code, monospace",
    ],
    supportAllValues: true,
  },
  fontSize: {
    options: [
      "default",
      "12px",
      "14px",
      "16px",
      "18px",
      "20px",
      "24px",
      "28px",
      "32px",
    ],
    supportAllValues: true,
  },
  alignment: {
    options: ["left", "center", "right", "justify"],
  },
  list: {
    properties: {
      styles: true,
      startIndex: true,
      reversed: true,
    },
  },
  image: {
    toolbar: [
      "toggleImageCaption",
      "imageTextAlternative",
      "|",
      "imageStyle:inline",
      "imageStyle:block",
      "imageStyle:side",
    ],
    styles: ["inline", "block", "side"],
  },
  table: {
    contentToolbar: [
      "tableColumn",
      "tableRow",
      "mergeTableCells",
      "tableProperties",
      "tableCellProperties",
    ],
  },
  licenseKey: "GPL",
  language: "es",
};

export { ClassicEditor };
