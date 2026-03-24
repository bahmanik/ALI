import AstalWp from "gi://AstalWp"
import { createBinding, createComputed, For } from "ags"
import { Gtk } from "ags/gtk4";
import Pango from "gi://Pango?version=1.0";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import icons from "src/lib/icons/icons";

const wp = AstalWp.get_default()!;

const speaker = wp?.audio.defaultSpeaker!;

const speakerVar = createComputed([
  createBinding(speaker, "description"),
  createBinding(speaker, "volume"),
  createBinding(speaker, "mute"),
]);

export function getVolumeIcon(speaker?: AstalWp.Endpoint) {
  let volume = speaker?.volume;
  let muted = speaker?.mute;
  let speakerIcon = speaker?.icon;
  if (volume == null || speakerIcon == null) return "";

  if (volume === 0 || muted) {
    return icons.audio.volume.muted;
  } else if (volume < 0.33) {
    return icons.audio.volume.low;
  } else if (volume < 0.66) {
    return icons.audio.volume.medium;
  } else {
    return icons.audio.volume.high;
  }
}

export const VolumeIcon = speakerVar(() => getVolumeIcon(speaker));

function StreamsList() {
  const audio = wp.audio!;
  const streams = createBinding(audio, "streams");

  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      spacing={10}
      visible={streams.as((l) => l.length > 0)}
    >
      <label label={"Applications"} halign={Gtk.Align.START} />
      <For each={streams}>
        {(stream) => {
          const name = createBinding(stream, "name");

          return (
            <box
              spacing={10}
              cssClasses={["slider-box", "volume-box"]}
            >
              <image
                iconName={
                  stream.icon ||
                  "audio-volume-high-symbolic"
                }
                pixel_size={24}
              />
              <box
                orientation={Gtk.Orientation.VERTICAL}
                spacing={10 / 2}
              >
                <label
                  label={name.as(
                    (name) =>
                      `${stream.description}: ${name}`,
                  )}
                  halign={Gtk.Align.START}
                  ellipsize={Pango.EllipsizeMode.END}
                  maxWidthChars={25}
                />
                <slider
                  onChangeValue={({ value }) => {
                    stream.volume = value;
                  }}
                  hexpand
                  value={createBinding(stream, "volume")}
                />
              </box>
            </box>
          );
        }}
      </For>
    </box>
  );
}

function DefaultOutput() {
  const audio = wp.audio!;
  const defaultOutput = audio.defaultSpeaker;
  const level = createBinding(defaultOutput, "volume");
  let dropdownbox: Gtk.Box;

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10}>
      <label label={"Output"} halign={Gtk.Align.START} />
      <button
        focusOnClick={false}
        onClicked={() => {
          const menu = new Gio.Menu();
          const Popover = Gtk.PopoverMenu.new_from_model(menu);

          const action = new Gio.SimpleAction({
            name: "select-speaker",
            parameter_type: new GLib.VariantType("i"),
          });

          action.connect("activate", (_, parameter) => {
            if (parameter === null) return;
            const speakerIndex = parameter.get_int32();

            if (audio.speakers[speakerIndex]) {
              audio.speakers[speakerIndex].set_is_default(true);
            }
          });

          audio.speakers.forEach((speaker, index) => {
            menu.append(
              speaker.description,
              `app.select-speaker(${index})`,
            );
          });

          Popover.set_parent(dropdownbox);
          Popover.popup();
        }}
        class={"dropdown"}
      >
        <box hexpand $={(self) => (dropdownbox = self)}>
          <label
            label={createBinding(defaultOutput, "description").as(
              (desc) => `${desc}`,
            )}
            hexpand
            halign={Gtk.Align.START}
            ellipsize={Pango.EllipsizeMode.END}
            maxWidthChars={25}
          />
          <image iconName={icons.ui.arrow.down} pixelSize={20} />
        </box>
      </button>
      <box
        cssClasses={["slider-box", "volume-box"]}
        spacing={10}
        valign={Gtk.Align.CENTER}
      >
        <image
          iconName={VolumeIcon}
          pixelSize={20}
          valign={Gtk.Align.CENTER}
          halign={Gtk.Align.START}
        />
        <slider
          onChangeValue={({ value }) => defaultOutput.set_volume(value)}
          hexpand
          value={level}
        />
      </box>
    </box>
  );
}

function DefaultMicrophone() {
  const audio = wp.audio!;
  const defaultMicrophone = audio.defaultMicrophone;
  const level = createBinding(defaultMicrophone, "volume");

  let dropdownbox: Gtk.Box;

  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10}>
      <label label={"Microphone"} halign={Gtk.Align.START} />
      <button
        onClicked={() => {
          const menu = new Gio.Menu();
          const Popover = Gtk.PopoverMenu.new_from_model(menu);

          const action = new Gio.SimpleAction({
            name: "select-speaker",
            parameter_type: new GLib.VariantType("i"),
          });

          action.connect("activate", (_, parameter) => {
            if (parameter === null) return;
            const microphoneIndex = parameter.get_int32();

            if (audio.microphones[microphoneIndex]) {
              audio.microphones[microphoneIndex].set_is_default(true);
            }
          });

          audio.microphones.forEach((speaker, index) => {
            menu.append(
              speaker.description,
              `app.select-speaker(${index})`,
            );
          });

          Popover.set_parent(dropdownbox);
          Popover.popup();
        }}
        class={"dropdown"}
      >
        <box hexpand $={(self) => (dropdownbox = self)}>
          <label
            label={createBinding(defaultMicrophone, "description").as(
              (desc) => `${desc}`,
            )}
            hexpand
            halign={Gtk.Align.START}
            ellipsize={Pango.EllipsizeMode.END}
            maxWidthChars={25}
          />
          <image iconName={icons.ui.arrow.down} pixelSize={20} />
        </box>
      </button>
      <box
        cssClasses={["slider-box", "volume-box"]}
        spacing={10}
        valign={Gtk.Align.CENTER}
      >
        { /* <image
          iconName={icons.microphone.default}
          pixelSize={20}
          valign={Gtk.Align.CENTER}
          halign={Gtk.Align.START}
        /> */ }
        <slider
          onChangeValue={({ value }) =>
            defaultMicrophone.set_volume(value)
          }
          hexpand
          value={level}
        />
      </box>
    </box>
  );
}

function List() {
  return (
    <Gtk.ScrolledWindow>
      <box
        orientation={Gtk.Orientation.VERTICAL}
        spacing={5}
        vexpand
      >
        <StreamsList />
        <DefaultOutput />
        <DefaultMicrophone />
      </box>
    </Gtk.ScrolledWindow>
  );
}

export function VolumeModule({ showArrow = false }: { showArrow?: boolean }) {
  return (
    <box
      class={"volume"}
      heightRequest={500 - 15 * 2}
      widthRequest={410 - 15 * 2}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={10}
    >
      <Header showArrow={showArrow} />
      <List />
    </box>
  );
}

export default function AudioOutput() {
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <menubutton>
      <image iconName={createBinding(speaker, "volumeIcon")} />
      <popover>
        <box>
          <VolumeModule />
        </box>
      </popover>
    </menubutton>
  )
}
function Header({ showArrow = false }: { showArrow?: boolean }) {
  return (
    <box class={"header"} spacing={10}>
      {showArrow && (
        <button
          cssClasses={["qs-header-button", "qs-page-prev"]}
          focusOnClick={false}
        >
          { /* <image iconName={icons.ui.arrow.down} pixelSize={20} /> */}
        </button>
      )}
      <label
        label={"Volume"}
        halign={Gtk.Align.START}
        valign={Gtk.Align.CENTER}
      />
      <box hexpand />
    </box>
  );
}
