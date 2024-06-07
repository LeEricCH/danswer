import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FiSend,
  FiFilter,
  FiPlusCircle,
  FiCpu,
  FiX,
  FiPlus,
  FiInfo,
} from "react-icons/fi";
import ChatInputOption from "./ChatInputOption";
import { FaBrain } from "react-icons/fa";
import { Persona } from "@/app/admin/assistants/interfaces";
import { FilterManager, LlmOverride, LlmOverrideManager } from "@/lib/hooks";
import { SelectedFilterDisplay } from "./SelectedFilterDisplay";
import { useChatContext } from "@/components/context/ChatContext";
import { getFinalLLM } from "@/lib/llm/utils";
import { FileDescriptor } from "../interfaces";
import { InputBarPreview } from "../files/InputBarPreview";
import { RobotIcon } from "@/components/icons/icons";
import { Hoverable } from "@/components/Hoverable";
import { AssistantIcon } from "@/components/assistants/AssistantIcon";
import { Tooltip } from "@/components/tooltip/Tooltip";
const MAX_INPUT_HEIGHT = 200;

export function ChatInputBar({
  personas,
  message,
  setMessage,
  onSubmit,
  isStreaming,
  setIsCancelled,
  retrievalDisabled,
  filterManager,
  llmOverrideManager,
  setSelectedAlternativeAssistant,
  selectedAssistant,
  files,
  setFiles,
  handleFileUpload,
  setConfigModalActiveTab,
  textAreaRef,
  alternativeAssistant,
}: {
  setSelectedAlternativeAssistant: Dispatch<SetStateAction<Persona | null>>;
  personas: Persona[];
  message: string;
  setMessage: (message: string) => void;
  onSubmit: () => void;
  isStreaming: boolean;
  setIsCancelled: (value: boolean) => void;
  retrievalDisabled: boolean;
  filterManager: FilterManager;
  llmOverrideManager: LlmOverrideManager;
  selectedAssistant: Persona;
  alternativeAssistant: Persona | null;
  files: FileDescriptor[];
  setFiles: (files: FileDescriptor[]) => void;
  handleFileUpload: (files: File[]) => void;
  setConfigModalActiveTab: (tab: string) => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  // handle re-sizing of the text area
  useEffect(() => {
    const textarea = textAreaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        MAX_INPUT_HEIGHT
      )}px`;
    }
  }, [message]);

  const { llmProviders } = useChatContext();
  const [_, llmName] = getFinalLLM(llmProviders, selectedAssistant);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const interactionsRef = useRef<HTMLDivElement | null>(null);

  // Click out of assistant suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !(
          !interactionsRef.current ||
          interactionsRef.current.contains(event.target as Node)
        )
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // On user input
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log(event.target.value);
    const text = event.target.value;
    setMessage(text);

    if (!text.startsWith("@")) {
      setShowSuggestions(false);
      return;
    }

    // If looking for an assistant...
    const match = text.match(/(?:\s|^)@(\w*)$/);
    if (match) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Redefines on state change
  const filteredPersonas = personas.filter((persona) =>
    persona.name.toLowerCase().startsWith(
      message
        .slice(message.lastIndexOf("@") + 1)
        .split(/\s/)[0]
        .toLowerCase()
    )
  );

  const [assistantIconIndex, setAssistantIconIndex] = useState(0);

  // Update selected persona
  const updateCurrentPersona = (persona: Persona) => {
    setSelectedAlternativeAssistant(persona);
    setAssistantIconIndex(0);

    // Reset input + suggestions
    setShowSuggestions(false);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      showSuggestions &&
      filteredPersonas.length > 0 &&
      (e.key === "Tab" || e.key == "Enter")
    ) {
      e.preventDefault();
      if (assistantIconIndex == filteredPersonas.length) {
        window.open("/assistants/new", "_blank");

        setShowSuggestions(false);
        setMessage("");
      } else {
        const option =
          filteredPersonas[assistantIconIndex >= 0 ? assistantIconIndex : 0];
        // setText(text + option + ' ');
        updateCurrentPersona(option);
      }

      // setFilter('');
      // setFilteredOptions(options);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setAssistantIconIndex((assistantIconIndex) =>
        Math.min(assistantIconIndex + 1, filteredPersonas.length)
      );
      // setSelectedOptionIndex((selectedOptionIndex + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAssistantIconIndex((assistantIconIndex) =>
        Math.max(assistantIconIndex - 1, 0)
      );
    }
  };

  return (
    <div>
      <div className="flex justify-center pb-2 max-w-screen-lg mx-auto mb-2">
        <div
          className="
            w-full
            shrink
            relative
            px-4
            w-searchbar-xs
            2xl:w-searchbar-sm
            3xl:w-searchbar
            mx-auto
          "
        >
          {showSuggestions && filteredPersonas.length > 0 && (
            <div
              ref={suggestionsRef}
              className="text-sm absolute inset-x-0 top-0 w-full transform -translate-y-full "
            >
              <div className="rounded-lg py-1.5 bg-white border border-gray-300 overflow-hidden shadow-lg mx-2  px-1.5 mt-2 rounded  z-10">
                {filteredPersonas.map((currentPersona, index) => (
                  <button
                    key={index}
                    className={`px-2 ${assistantIconIndex == index && "bg-gray-200"} rounded content-start flex gap-x-1 py-1.5 w-full  hover:bg-gray-100 cursor-pointer`}
                    onClick={() => {
                      updateCurrentPersona(currentPersona);
                    }}
                  >
                    <p className="font-bold ">{currentPersona.name}</p>
                    <p className="line-clamp-1">
                      {currentPersona.id == selectedAssistant.id &&
                        "(default) "}
                      {currentPersona.description}
                    </p>
                  </button>
                ))}
                <a
                  key={filteredPersonas.length}
                  target="_blank"
                  className={`${assistantIconIndex == filteredPersonas.length && "bg-gray-200"} px-3 flex gap-x-1 py-2 w-full  items-center  hover:bg-gray-100 cursor-pointer"`}
                  href="/assistants/new"
                >
                  <FiPlus size={17} />
                  <p>Create a new assistant</p>
                </a>
              </div>
            </div>
          )}

          <div>
            <SelectedFilterDisplay filterManager={filterManager} />
          </div>

          <div
            className="
              opacity-100
              w-full
              h-fit
              flex
              flex-col
              border
              border-border
              rounded-lg
              bg-background
              [&:has(textarea:focus)]::ring-1
              [&:has(textarea:focus)]::ring-black
            "
          >
            {/* <TooltipProvider> */}

            {alternativeAssistant && (
              <div className="flex flex-wrap gap-y-1 gap-x-2 px-2 pt-1.5 w-full  ">
                <div className="bg-neutral-200 p-2 rounded-t-lg  items-center flex w-full">
                  {/* <RobotIcon size={20} /> */}

                  <AssistantIcon assistant={alternativeAssistant} border />
                  <p className="ml-3 text-neutral-800 my-auto">
                    {alternativeAssistant.name}
                  </p>
                  <div ref={interactionsRef} className="flex gap-x-1 ml-auto ">
                    {/* <Tooltip>
                        <Trigger asChild>
                          <button>
                            <Hoverable
                              icon={FiInfo}
                            />
                          </button>
                        </Trigger>
                        <Content
                          side="top"
                          align="center"
                          sideOffset={5}
                          style={{
                            background: 'black',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {"hi"}
                          <Arrow style={{ fill: 'black' }} />
                        </Content>
                      </Tooltip> */}

                    <Tooltip
                      content={
                        <p className="max-w-sm flex flex-wrap">
                          {alternativeAssistant.description}
                        </p>
                      }
                    >
                      <button>
                        <Hoverable icon={FiInfo} />
                      </button>
                    </Tooltip>

                    <Hoverable
                      icon={FiX}
                      onClick={() => setSelectedAlternativeAssistant(null)}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* </TooltipProvider> */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-y-1 gap-x-2 px-2 pt-2">
                {files.map((file) => (
                  <div key={file.id}>
                    <InputBarPreview
                      file={file}
                      onDelete={() => {
                        setFiles(
                          files.filter(
                            (fileInFilter) => fileInFilter.id !== file.id
                          )
                        );
                      }}
                      isUploading={file.isUploading || false}
                    />
                  </div>
                ))}
              </div>
            )}

            <textarea
              onKeyDownCapture={handleKeyDown}
              ref={textAreaRef}
              className={`
                m-0
                w-full
                shrink
                resize-none
                border-0
                bg-transparent
                ${
                  textAreaRef.current &&
                  textAreaRef.current.scrollHeight > MAX_INPUT_HEIGHT
                    ? "overflow-y-auto mt-2"
                    : ""
                }
                whitespace-normal
                break-word
                overscroll-contain
                outline-none
                placeholder-gray-400
                overflow-hidden
                resize-none
                pl-4
                pr-12
                py-4
                h-14
              `}
              // onInput={handleKeyDown}
              autoFocus
              style={{ scrollbarWidth: "thin" }}
              role="textarea"
              aria-multiline
              placeholder="Send a message..."
              value={message}
              onChange={handleInputChange}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  message &&
                  !isStreaming
                ) {
                  onSubmit();
                  event.preventDefault();
                }
              }}
              suppressContentEditableWarning={true}
            />
            <div className="flex items-center space-x-3 px-4 pb-2">
              <ChatInputOption
                name={selectedAssistant ? selectedAssistant.name : "Assistants"}
                icon={FaBrain}
                onClick={() => setConfigModalActiveTab("assistants")}
              />

              <ChatInputOption
                name={
                  llmOverrideManager.llmOverride.modelName ||
                  (selectedAssistant
                    ? selectedAssistant.llm_model_version_override || llmName
                    : llmName)
                }
                icon={FiCpu}
                onClick={() => setConfigModalActiveTab("llms")}
              />
              {!retrievalDisabled && (
                <ChatInputOption
                  name="Filters"
                  icon={FiFilter}
                  onClick={() => setConfigModalActiveTab("filters")}
                />
              )}
              <ChatInputOption
                name="File"
                icon={FiPlusCircle}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true; // Allow multiple files
                  input.onchange = (event: any) => {
                    const files = Array.from(
                      event?.target?.files || []
                    ) as File[];
                    if (files.length > 0) {
                      handleFileUpload(files);
                    }
                  };
                  input.click();
                }}
              />
            </div>
            <div className="absolute bottom-2.5 right-10">
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (!isStreaming) {
                    if (message) {
                      onSubmit();
                    }
                  } else {
                    setIsCancelled(true);
                  }
                }}
              >
                <FiSend
                  size={18}
                  className={`text-emphasis w-9 h-9 p-2 rounded-lg ${
                    message ? "bg-blue-200" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
