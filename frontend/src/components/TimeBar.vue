<script setup lang="ts">
import { useNoteStackStore } from '../stores/note_stack';

const noteStackStore = useNoteStackStore();

let year = 2020;
let month = 0;

const cur_date = new Date;
const cur_year = cur_date.getFullYear();
const cur_month = cur_date.getMonth();

const months :{year:number, month:number}[] = [];

while(true) {
	months.push( {year, month} );
	++month;
	if( month === 12 ) {
		month = 0;
		++year;
	}
	if( year === cur_year && month === cur_month ) break;
}

const month_strs = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

function monthClicked(event:Event, month:{year:number, month:number}) {
	const d = new Date;
	d.setFullYear(month.year);
	d.setMonth(month.month);
	d.setDate(1);
	noteStackStore.goToDate(d);
}

</script>

<template>
	<div class="bg-slate-50 h-full absolute top-0 right-0 overflow-x-scroll" style="width:50px;">
		<div>
			<div v-for="m in months" class="h-12 text-center" @click="monthClicked($event, m)">
				<span v-if="m.month === 0" class="block text-sm font-bold text-gray-400">{{ m.year }}</span>
				<span class="block uppercase text-sm text-gray-500">{{ month_strs[m.month] }}</span>
			</div>
		</div>
	</div>
</template>