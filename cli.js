#!/usr/bin/env node
'use strict'

const minimist = require('minimist')
const floor = require('floordate')
const parseTime = require('parse-messy-time')
const vbb = require('vbb-client')
const footprint = require('berlin-commute-footprint')

const pkg = require('./package.json')

const argv = minimist(process.argv.slice(2))

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    berlin-commute-footprint <from-id> <to-id> <time> [--days]
Options:
    --days  -d  Days of week you commute at. Comma-separated.
                Default: monday,tuesday,wednesday,thursday,friday
Examples:
    berlin-commute-footprint 900000220001 900000017104 09:00 --days monday,sunday
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`berlin-commute-footprint v${pkg.version}\n`)
	process.exit(0)
}

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const stationId = /^\d{7,12}$/

const fromId = argv._.shift()
if (!fromId) showError('Missing from-id argument.')
if (!stationId.test(fromId + '')) showError('from-id must be a valid station ID.')

const toId = argv._.shift()
if (!toId) showError('Missing to-id argument.')
if (!stationId.test(toId + '')) showError('to-id must be a valid station ID.')

let time = argv._.shift()
if (!time) showError('Missing time argument.')
const monday = floor(new Date(), 'week')
const nextMonday = new Date(+monday + 7 * 24 * 60 * 60 * 1000)
const when = parseTime(time, {now: nextMonday})

let days = 'monday,tuesday,wednesday,thursday,friday'
if (argv.days || argv.d) days = argv.days || argv.d
days = days.split(',').map((day) => day.trim())

vbb.journeys(fromId, toId, {
	when, results: 1,
	identifier: 'berlin-commute-footprint-cli'
})
.then(([journey]) => footprint(journey)) // todo: pass in weekdays
.then((data) => {
	process.stdout.write(JSON.stringify(data))
})
.catch(showError)
