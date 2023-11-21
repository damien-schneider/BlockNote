import {
  BlockFromConfig,
  BlockNoteDOMAttributes,
  BlockNoteEditor,
  BlockSchemaWithBlock,
  camelToDataKebab,
  createInternalBlockSpec,
  createStronglyTypedTiptapNode,
  CustomBlockConfig,
  getBlockFromPos,
  inheritedProps,
  InlineContentSchema,
  mergeCSSClasses,
  parse,
  Props,
  PropSchema,
  propsToAttributes,
  StyleSchema,
} from "@blocknote/core";
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { createContext, ElementType, FC, HTMLProps, useContext } from "react";
import { renderToString } from "react-dom/server";

// this file is mostly analogoues to `customBlocks.ts`, but for React blocks

// extend BlockConfig but use a React render function
export type ReactCustomBlockImplementation<
  T extends CustomBlockConfig,
  I extends InlineContentSchema,
  S extends StyleSchema
> = {
  render: FC<{
    block: BlockFromConfig<T, I, S>;
    editor: BlockNoteEditor<BlockSchemaWithBlock<T["type"], T>, I, S>;
  }>;
  toExternalHTML?: FC<{
    block: BlockFromConfig<T, I, S>;
    editor: BlockNoteEditor<BlockSchemaWithBlock<T["type"], T>, I, S>;
  }>;
};

const BlockNoteDOMAttributesContext = createContext<BlockNoteDOMAttributes>({});

export const InlineContent = <Tag extends ElementType>(
  props: { as?: Tag } & HTMLProps<Tag>
) => {
  const inlineContentDOMAttributes =
    useContext(BlockNoteDOMAttributesContext).inlineContent || {};

  const classNames = mergeCSSClasses(
    props.className || "",
    "bn-inline-content",
    inlineContentDOMAttributes.class
  );

  return (
    <NodeViewContent
      {...Object.fromEntries(
        Object.entries(inlineContentDOMAttributes).filter(
          ([key]) => key !== "class"
        )
      )}
      {...props}
      className={classNames}
    />
  );
};

// Function that wraps the React component returned from 'blockConfig.render' in
// a `NodeViewWrapper` which also acts as a `blockContent` div. It contains the
// block type and props as HTML attributes.
export function reactWrapInBlockStructure<
  BType extends string,
  PSchema extends PropSchema
>(
  element: JSX.Element,
  blockType: BType,
  blockProps: Props<PSchema>,
  propSchema: PSchema,
  domAttributes?: Record<string, string>
) {
  return () => (
    // Creates `blockContent` element
    <NodeViewWrapper
      // Adds custom HTML attributes
      {...Object.fromEntries(
        Object.entries(domAttributes || {}).filter(([key]) => key !== "class")
      )}
      // Sets blockContent class
      className={mergeCSSClasses(
        "bn-block-content",
        domAttributes?.class || ""
      )}
      // Sets content type attribute
      data-content-type={blockType}
      // Adds props as HTML attributes in kebab-case with "data-" prefix. Skips
      // props which are already added as HTML attributes to the parent
      // `blockContent` element (inheritedProps) and props set to their default
      // values
      {...Object.fromEntries(
        Object.entries(blockProps)
          .filter(
            ([prop, value]) =>
              !inheritedProps.includes(prop) &&
              value !== propSchema[prop].default
          )
          .map(([prop, value]) => {
            return [camelToDataKebab(prop), value];
          })
      )}>
      {element}
    </NodeViewWrapper>
  );
}

// A function to create custom block for API consumers
// we want to hide the tiptap node from API consumers and provide a simpler API surface instead
export function createReactBlockSpec<
  T extends CustomBlockConfig,
  I extends InlineContentSchema,
  S extends StyleSchema
>(
  blockConfig: T,
  blockImplementation: ReactCustomBlockImplementation<T, I, S>
) {
  const node = createStronglyTypedTiptapNode({
    name: blockConfig.type as T["type"],
    content: (blockConfig.content === "inline"
      ? "inline*"
      : "") as T["content"] extends "inline" ? "inline*" : "",
    group: "blockContent",
    selectable: true,

    addAttributes() {
      return propsToAttributes(blockConfig as any); // TODO: cast
    },

    parseHTML() {
      return parse(blockConfig);
    },

    addNodeView() {
      return (props) =>
        ReactNodeViewRenderer(
          (props: NodeViewProps) => {
            // Gets the BlockNote editor instance
            const editor = this.options.editor! as BlockNoteEditor<any>;
            // Gets the block
            const block = getBlockFromPos(
              props.getPos,
              editor,
              this.editor,
              blockConfig.type
            ) as any;
            // Gets the custom HTML attributes for `blockContent` nodes
            const blockContentDOMAttributes =
              this.options.domAttributes?.blockContent || {};

            const Content = blockImplementation.render;
            const BlockContent = reactWrapInBlockStructure(
              <Content block={block} editor={editor as any} />,
              block.type,
              block.props,
              blockConfig.propSchema,
              blockContentDOMAttributes
            );

            return <BlockContent />;
          },
          {
            className: "bn-react-node-view-renderer",
          }
        )(props);
    },
  });

  return createInternalBlockSpec(blockConfig, {
    node: node,
    toInternalHTML: (block, editor) => {
      const blockContentDOMAttributes =
        node.options.domAttributes?.blockContent || {};

      const Content = blockImplementation.render;
      const BlockContent = reactWrapInBlockStructure(
        <Content block={block as any} editor={editor as any} />,
        block.type,
        block.props,
        blockConfig.propSchema,
        blockContentDOMAttributes
      );

      const parent = document.createElement("div");
      parent.innerHTML = renderToString(<BlockContent />);

      return {
        dom: parent.firstElementChild! as HTMLElement,
        contentDOM: (parent.querySelector(".bn-inline-content") ||
          undefined) as HTMLElement | undefined,
      };
    },
    toExternalHTML: (block, editor) => {
      const blockContentDOMAttributes =
        node.options.domAttributes?.blockContent || {};

      let Content = blockImplementation.toExternalHTML;
      if (Content === undefined) {
        Content = blockImplementation.render;
      }
      const BlockContent = reactWrapInBlockStructure(
        <Content block={block as any} editor={editor as any} />,
        block.type,
        block.props,
        blockConfig.propSchema,
        blockContentDOMAttributes
      );

      const parent = document.createElement("div");
      parent.innerHTML = renderToString(<BlockContent />);

      return {
        dom: parent.firstElementChild! as HTMLElement,
        contentDOM: (parent.querySelector(".bn-inline-content") ||
          undefined) as HTMLElement | undefined,
      };
    },
  });
}
