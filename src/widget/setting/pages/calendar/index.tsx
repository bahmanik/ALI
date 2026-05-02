import { Accessor } from "gnim"
import { Gtk } from "ags/gtk4"
import { Header } from "../../_component/header"
import { Option } from "../../_component/option"
import options from "src/configuration"
import { AnchorLayoutValues } from "src/configuration/types"
import { BorderLocationValues, CalendarValues, WeekDaysValues } from "src/configuration/widgets/calendar/enums"

type CalendarProps = JSX.IntrinsicElements["box"]

const Calendar = (props: CalendarProps) => {
  const { calendar } = options
  const { window, style, header, grid } = calendar
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      {...props}
    >
      <Header title="calendar" />
      <Option type="enum" title="calendar type" opt={calendar.calendar} values={CalendarValues} />
      <Option type="string" title="locals" opt={calendar.locale} />
      <Option type="enum" title="start of week day" opt={calendar.startOfWeek} values={WeekDaysValues} />
      { /* <Option title="" opt={calendar.weekend} array /> */}
      <Option type="boolean" title="show outside Days" opt={calendar.showOutsideDays} />
      <Option type="boolean" title="show week numbers" opt={calendar.showWeekNumbers} />
      <Option type="boolean" title="show secondary date" opt={calendar.showSecondaryDate} />
      <Option type="enum" title="secondary calendar type" opt={calendar.secondaryCalendar} values={CalendarValues} />

      <Header title="window" />
      <Option type="number" title="width" opt={window.width} />
      <Option type="number" title="height" opt={window.height} />
      <Option type="number" title="margin" opt={window.margin} />
      <Option type="enum" title="layout" values={AnchorLayoutValues} opt={window.layout} />
      { /* <Option title="" opt={window.revealTransition} enums={RevealTransitionWithAutoEnum} /> */}
      <Option type="number" title="transition duration" opt={window.transitionDuration} />

      <Header title="style" />
      <Option type="color" title="background" opt={style.bg} />
      <Option type="number" title="background opacity" opt={style.bgOpacity} />
      <Option type="number" title="radius" opt={style.radius} />
      <Option type="number" title="padding" opt={style.padding} />
      <Option type="enum" title="borderLocation" opt={style.borderLocation} values={BorderLocationValues} />
      <Option type="number" title="border width" opt={style.borderWidth} />
      <Option type="color" title="border color" opt={style.borderColor} />
      <Option type="boolean" title="shadow Enable" opt={style.shadowEnable} />
      <Option type="number" title="shadowX" opt={style.shadowX} />
      <Option type="number" title="shadowY" opt={style.shadowY} />
      <Option type="number" title="shadow blur" opt={style.shadowBlur} />
      <Option type="number" title="shadow spread" opt={style.shadowSpread} />
      <Option type="color" title="shadow color" opt={style.shadowColor} />

      <Header title="header" />
      <Option type="boolean" title="show" opt={header.show} />
      <Option type="number" title="navigation Button Size" opt={header.navButtonSize} />
      <Option type="number" title="navigation Button Radius" opt={header.navButtonRadius} />

      <Header title="grid" />
      <Option type="number" title="weekday opacity" opt={grid.weekdayOpacity} />
      <Option type="number" title="cell radius" opt={grid.cellRadius} />
      <Option type="number" title="cell padding" opt={grid.cellPadding} />
      <Option type="number" title="cell gap" opt={grid.cellGap} />
      <Option type="number" title="outside opacity" opt={grid.outsideOpacity} />
      <Option type="number" title="weekend opacity" opt={grid.weekendOpacity} />
      <Option type="color" title="today background" opt={grid.todayBg} />
      <Option type="color" title="selected background" opt={grid.selectedBg} />
      <Option type="color" title="hover background" opt={grid.hoverBg} />
    </box>
  )
}

export default Calendar
