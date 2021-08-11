import * as $ from 'jquery'

import { RRule, Weekday, Options } from '../src/index'

// Make library accessible to browser debuggers so users can try things out themselves
// tslint:disable-next-line:no-duplicate-imports
import * as rruleExports from '../src/index'
$.extend(window, rruleExports)

const getDay = (i: number) => [
  RRule.MO,
  RRule.TU,
  RRule.WE,
  RRule.TH,
  RRule.FR,
  RRule.SA,
  RRule.SU
][i]

const makeArray = (s: string | string[]) =>
  Array.isArray(s) ? s : [s]

const getFormValues = function ($form: JQuery<HTMLElement>) {
  const paramObj: { [K in keyof Partial<Options>]: string | string[] } = {}
  $form.serializeArray().forEach(kv => {
    const k = kv.name as keyof Options
    if (paramObj.hasOwnProperty(k)) {
      const v = makeArray(paramObj[k]!)
      v.push(kv.value)
      paramObj[k] = v
    } else {
      paramObj[k] = kv.value
    }
  })

  return paramObj
}

const getOptionsCode = function (options: Partial<Options>) {
  const days = [
    'RRule.MO',
    'RRule.TU',
    'RRule.WE',
    'RRule.TH',
    'RRule.FR',
    'RRule.SA',
    'RRule.SU'
  ]

  const items = Object.keys(options).map((k: keyof Options) => {
    let v: unknown = options[k]
    if (v === null) {
      v = 'null'
    } else if (k === 'freq') {
      v = `RRule.${RRule.FREQUENCIES[v as number]}`
    } else if (k === 'dtstart' || k === 'until') {
      const d = v as Date
      v =
        'new Date(Date.UTC(' +
        [
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
          d.getUTCHours(),
          d.getUTCMinutes(),
          d.getUTCSeconds()
        ].join(', ') +
        '))'
    } else if (k === 'byweekday') {
      if (Array.isArray(v)) {
        v = (v as Weekday[]).map(function (wday) {
          console.log('wday', wday)
          let s = days[wday.weekday]
          if (wday.n) {
            return s + `.nth(${wday.n})`
          }
          return s
        })
      } else {
        const w = v as Weekday
        v = days[w.weekday]
      }
    } else if (k === 'wkst') {
      if (v === RRule.MO) {
        return ''
      }
      const w = v as Weekday
      v = days[w.weekday]
    }

    if (Array.isArray(v)) {
      v = `[${v.join(', ')}]`
    }

    console.log(k, ' =', v)
    return `${k}: ${v}`
  })

  return `{\n  ${items.filter(v => !!v).join(',\n  ')}\n}`
}

const makeRows = function (dates: Date[]) {
  let prevParts: string[] = []
  let prevStates: boolean[] = []

  const rows = dates.map((date, index) => {
    let states: boolean[] = []
    let parts = date.toUTCString().split(' ')

    const cells = parts.map((part, i) => {
      if (part !== prevParts[i]) {
        states[i] = !prevStates[i]
      } else {
        states[i] = prevStates[i]
      }
      const cls = states[i] ? 'a' : 'b'
      return `<td class='${cls}'>${part}</td>`
    })

    prevParts = parts
    prevStates = states

    return `<tr><td>${index + 1}</td>${cells.join('\n')}</tr>`
  })

  return rows.join('\n\n')
}

$(function () {
  const $tabs = $('#tabs')

  const activateTab = function ($a: JQuery<HTMLElement>) {
    const id = $a.attr('href')!.split('#')[1]
    $tabs.find('a').removeClass('active')
    $a.addClass('active')
    $('#input-types section').hide()
    return $(`#input-types #${id}`)
      .show()
      .find('input:first')
      .trigger('focus')
      .trigger('change')
  }

  $('#input-types section')
    .hide()
    .each(function () {
      $('<a />', {
        href: `#${$(this).attr('id')}`
      })
        .text(
          $(this)
            .find('h3')
            .hide()
            .text()
        )
        .appendTo($tabs)
        .on('click', function () {
          activateTab($(this))
          return false
        })
    })

  $('.examples code').on('click', function () {
    const $code = $(this)
    return $code
      .parents('section:first')
      .find('input')
      .val($code.text())
      .trigger('change')
  })

  let init: string
  let makeRule: () => RRule

  $('input, select').on('keyup change', function () {
    const $in = $(this)
    const $section = $in.parents('section:first')
    const inputMethod = $section.attr('id')!.split('-')[0]

    switch (inputMethod) {
      case 'text':
        makeRule = () => RRule.fromText($in.val()!.toString())
        init = `RRule.fromText("${(this as HTMLFormElement).value}")`
        break
      case 'rfc':
        makeRule = () => RRule.fromString((this as HTMLFormElement).value)
        init = `RRule.fromString("${(this as HTMLFormElement).value}")`
        break
      case 'options':
        let values = getFormValues($in.parents('form'))
        let options: Partial<Options> = {}

        for (const k in values) {
          const key = k as keyof Options

          let value = values[key]
          if (!value) {
            continue
          }

          switch (key) {
            case 'dtstart':
            case 'until':
              const date = new Date(Date.parse(value + 'Z'))
              options[key] = date
              continue

            case 'byweekday':
              if (Array.isArray(value)) {
                options[key] = value.map(i => getDay(parseInt(i, 10)))
              } else {
                options[key] = getDay(parseInt(value, 10))
              }
              continue

            case 'wkst':
              options[key] = getDay(parseInt(value as string, 10))
              continue

            case 'interval':
              const i = parseInt(value as string, 10)
              if (i === 1 || !value) {
                continue
              }

              options[key] = i
              continue

            case 'tzid':
              options[key] = value as string
              continue

            case 'byweekday':
            case 'byweekno':
            case 'byhour':
            case 'byminute':
            case 'bysecond':
            case 'byyearday':
            case 'bymonth':
            case 'bymonthday':
            case 'bysetpos':
            case 'bynmonthday':
              if (!Array.isArray(value)) {
                value = value.split(/[,\s]+/)
              }
              value = value.filter(v => v)
              options[key] = value.map(n => parseInt(n, 10))
              continue

            case 'bynweekday':
              if (!Array.isArray(value)) {
                value = value.split(/[,\s]+/)
              }
              value = value.filter(v => v)
              options[key] = [value.map(n => parseInt(n, 10))]
              continue

            case 'byeaster':
              options[key] = parseInt(value as string, 10)
              continue

            case 'freq':
            case 'count':
              options[key] = parseInt(value as string, 10)
              continue

            default:
              console.warn('Unsupported key', key)
              continue
          }
        }

        makeRule = () => new RRule(options)
        init = `new RRule(${getOptionsCode(options)})`
        console.log(options)
        break
    }

    $('#init').html(init)
    $('#rfc-output a').html('')
    $('#text-output a').html('')
    $('#options-output').html('')
    $('#dates').html('')

    let rule: RRule
    try {
      rule = makeRule()
    } catch (e) {
      $('#init').append(
        $('<pre class="error"/>').text(`=> ${String(e || null)}`)
      )
      return
    }

    const rfc = rule.toString()
    const text = rule.toText()
    $('#rfc-output a')
      .text(rfc)
      .attr('href', `#/rfc/${rfc}`)
    $('#text-output a')
      .text(text)
      .attr('href', `#/text/${text}`)
    $('#options-output').text(getOptionsCode(rule.origOptions))
    if (inputMethod === 'options') {
      $('#options-output')
        .parents('tr')
        .hide()
    } else {
      $('#options-output')
        .parents('tr')
        .show()
    }
    const max = 500
    const dates = rule.all(function (date, i) {
      if (!rule.options.count && i === max) {
        return false // That's enough
      }
      return true
    })

    let html = makeRows(dates)
    if (!rule.options.count) {
      html += `\
<tr><td colspan='7'><em>Showing first ${max} dates, set
<code>count</code> to see more.</em></td></tr>\
`
    }
    return $('#dates').html(html)
  })

  activateTab($tabs.find('a:first'))

  const processHash = function () {
    const hash = location.hash.substring(1)
    if (hash) {
      const match = /^\/(rfc|text)\/(.+)$/.exec(hash)
      if (match) {
        const method = match[1] // rfc | text
        const arg = match[2]
        activateTab($(`a[href='#${method}-input']`))
        return $(`#${method}-input input:first`)
          .val(decodeURIComponent(arg))
          .trigger('change')
      }
    }
  }
  processHash()
  return $(window).on('hashchange', processHash)
})
