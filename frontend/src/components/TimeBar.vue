<script setup lang="ts">
import { useNoteStackStore } from '../stores/note_stack';

const noteStackStore = useNoteStackStore();

let year = 2020;
let month = 0;

const cur_date = new Date;
const cur_year = cur_date.getFullYear();
const cur_month = cur_date.getMonth();

const months :{year:number, month:number}[] = [];
months.push( {year, month} );
while(true) {
	++month;
	if( month === 12 ) {
		month = 0;
		++year;
	}
	months.push( {year, month} );
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
function endClicked() {
	const d = new Date;
	d.setDate(d.getDate() + 1);
	noteStackStore.goToDate(d);
}

</script>

<template>
	<div class="bg-slate-50 h-full absolute top-0 right-0 flex flex-col">
		<div class=" overflow-x-scroll ill-bottom-scroll" style="width:50px;">
			<div>
				<template v-for="m in months">
					<div v-if="m.month === 0" class="block text-center text-sm font-bold bg-gray-500 text-gray-50">{{ m.year }}</div>
					<a href="#" class="h-12 border-t border-gray-300 flex items-center justify-center hover:bg-yellow-200" @click.stop.prevent="monthClicked($event, m)">
						<span class="uppercase text-sm text-gray-500">{{ month_strs[m.month] }}</span>
					</a>
				</template>
			</div>
		</div>
		<a href="#" class="h-12 text-center bg-gray-500 hover:bg-yellow-500 text-gray-50 py-2" @click.stop.prevent="endClicked">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 inline">
				<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
			</svg>
		</a>
	</div>
</template>

<style scoped>
/* From https://stackoverflow.com/questions/18614301/keep-overflow-div-scrolled-to-bottom-unless-user-scrolls-up */
.ill-bottom-scroll {
	display: flex;
	flex-direction: column-reverse;
}
</style>