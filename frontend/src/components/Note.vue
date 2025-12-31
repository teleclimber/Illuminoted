<script setup lang="ts">
import {computed, ref, Ref, onMounted, onUnmounted} from 'vue';
import { useNoteEditorStore } from '../stores/note_editor';
import { useUIStateStore } from '../stores/ui_state';

import type {Note} from '../stores/graph';

import RelationsControls from './RelationsControls.vue';
import RelationIcon from './RelationIcon.vue';

const noteEditorStore = useNoteEditorStore();
const uiStateStore = useUIStateStore();

const props = defineProps<{
	note: Ref<Note>,
	iObs: IntersectionObserver|undefined
}>();

const note_elem :Ref<HTMLElement|undefined> = ref();
onMounted( () => {
	if( !note_elem.value ) throw new Error("no note element");
	if( !props.iObs ) throw new Error("no intersection observer")
	props.iObs.observe(note_elem.value);
});
onUnmounted( () => {
	if( note_elem.value ) props.iObs?.unobserve(note_elem.value);
});

type TextNode = {
	text: string
	search_highlight?: boolean
	url?: string
	subs?: TextNode[]
}

const contents = computed( () => {
	const c = props.note.value.contents;
	let ret :TextNode[] = [];
	const url = new RegExp('https?:\/\/\\S+', 'igd');
	let cur_i = 0;
	for( const match of c.matchAll(url) ) {
		//@ts-ignore TS does not have indices yet: https://github.com/microsoft/TypeScript/issues/44227
		const start = match.indices[0][0];
		//@ts-ignore TS does not have indices yet: https://github.com/microsoft/TypeScript/issues/44227
		const end = match.indices[0][1];
		if( start > cur_i ) {
			ret.push({text:c.substring(cur_i, start)});
		}
		const href = c.substring(start, end)
		ret.push({text:href, url:href, subs:[{text:href}]});
		cur_i = end;
	}
	if( cur_i < c.length ) ret.push({text:c.substring(cur_i, c.length)});

	const search = uiStateStore.debounced_search;
	if(search) {
		// find search term in non-url strings segments (for now)
		//ret.forEach( (s, i) => {
		for( let i=ret.length-1; i>=0; --i ) {
			const sub_ret = ret[i];
			cur_i = 0;
			const str = sub_ret.text;
			const sub:TextNode[] = [];
			const re = new RegExp(search, 'igd');
			for( const match of str.matchAll(re) ) {
				//@ts-ignore TS does not have indices yet: https://github.com/microsoft/TypeScript/issues/44227
				const start = match.indices[0][0];
				//@ts-ignore TS does not have indices yet: https://github.com/microsoft/TypeScript/issues/44227
				const end = match.indices[0][1];
				if( start > cur_i ) {
					sub.push({text:str.substring(cur_i, start)});
				}
				sub.push({text:str.substring(start, end), search_highlight: true});
				cur_i = end;
			}
			if( cur_i < str.length ) sub.push({text:str.substring(cur_i, str.length)});

			if( sub_ret.url !== undefined ) sub_ret.subs = sub;
			else ret.splice(i, 1, ...sub);
		};
	}
	return ret;
});

const selected = computed( () => uiStateStore.selected_note_id === props.note.value.id );

const relations = computed( () => {
	const note_id = props.note.value.id;
	const ret: Record<'above'|'below', Record<string,number>> = {'above':{}, 'below': {}};
	props.note.value.relations.forEach(r => {
		let dir:'above'|'below' = 'above';
		if( r.target === note_id ) dir = 'below';
		if( !ret[dir][r.label] ) ret[dir][r.label] = 0;
		ret[dir][r.label]++;
	});
	return ret;
});

// Here we could just iterate over noteEditorStore.rel_edits and check if target is this note
// But that measn doing this for every displayed note. Yikes.
// Let's do this for now?
const edit_rels = computed( () => {
	return noteEditorStore.rel_edit.filter( (d) => d.note_id === props.note.value.id && (d.action==='' || d.action==='add')  );
});

const show_rel_controls = computed( () => selected.value && noteEditorStore.has_data );

const classes = computed( () => {
	if( selected.value ) {
		return ['bg-yellow-200', 'hover:bg-yellow-100']
	}
	else if( props.note.value.id === noteEditorStore.edit_note_id ) {
		return ['bg-lime-200'];
	}
	else {
		return ['hover:bg-yellow-50'];
	}
});

</script>

<template>
	<div class="flex flex-col md:flex-row overflow-x-hidden" :class="classes" :id="'stack-note-'+note.value.id" 
		:data-node-id="note.value.id"
		@click="uiStateStore.toggleSelectNote(note.value.id)"
		ref="note_elem">
		<a href="#" class="flex-shrink-0 text-gray-500 md:w-28" @click.stop.prevent="uiStateStore.drillDownNote(note.value.id)">{{note.value.created.toLocaleTimeString()}}</a>
		<div class="md:border-l-2 md:pl-1 border-amber-700 flex-grow md:pb-1" >
			<p class="">
				<template v-for="c in contents">
					<a v-if="c.url" :href="c.url" class="text-blue-600 underline wrap-anywhere">
						<template v-for="sub_c in c.subs">
							<span v-if="sub_c.search_highlight" class="bg-pink-300">{{sub_c.text}}</span>
							<span v-else>{{sub_c.text}}</span>
						</template>
					</a>
					<span v-else-if="c.search_highlight" class="bg-pink-300">{{c.text}}</span>
					<span v-else>{{c.text}}</span>
				</template>
			</p>
		</div>
		
		<div class="flex flex-shrink-0 justify-end self-end md:w-40 md:self-start">
			<span>&nbsp;</span>

			<span v-for="d in edit_rels"
				class="bg-yellow-200 rounded px-1">
				<RelationIcon :label="d.label" class="h-5 w-5"></RelationIcon>
			</span>

			<span v-if="Object.keys(relations.above).length" class="flex border-b-2">
				<span v-for="num, label in relations.above" class="flex ">
					<RelationIcon :label="label" class="h-5 w-5"></RelationIcon>
				</span>
			</span>
			<span v-if="Object.keys(relations.below).length" class="flex border-t-2"> 
				<span v-for="num, label in relations.below" class="flex">
					<RelationIcon :label="label" class="h-5 w-5"></RelationIcon>
				</span>
			</span>
		</div>
		
	</div>
	<div class="relative" v-if="show_rel_controls">
		<RelationsControls class="absolute right-0 z-10" style="top: -1.5rem" :note="note"></RelationsControls>
		<!-- also controls for selected note: Edit, "reply", "thread-out"? -->
	</div>
</template>