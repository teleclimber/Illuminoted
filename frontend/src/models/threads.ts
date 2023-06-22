import {computed, ref, shallowRef, reactive} from 'vue';
import type {Ref, ComputedRef} from 'vue';
import { defineStore } from 'pinia';

export type Thread = {
	id: number,
	parent: number|null,
	name: string,
	created: Date,
	num_children: number
}

export const useThreadsStore = defineStore('threads', () => {
	const threads :Map<number,Thread> = reactive(new Map); 

	async function getLatestSubThreads(root:number, limit: number) {
		const resp = await fetch('/api/threads/'+root+'?deep=true&limit='+limit);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		const ids :number[] = []; 
		data.forEach( d => {
			const id = ingestThread(d);
			ids.push(id);
		});
		return ids;
	}

	async function loadChildren(root:number, limit: number) {
		const resp = await fetch('/api/threads/'+root+'?limit='+limit);
		if( !resp.ok ) throw new Error("fetch not OK");
		const data = <any[]>await resp.json();
		data.forEach( ingestThread );
	}
	function ingestThread(raw:any) {
		const id = parseInt(raw.id);
		let thread = threads.get(id);
		if( thread ) Object.assign(thread, {
			id,
			name: raw.name+'',
			created: new Date(raw.created),
			parent: raw.parent_id,
		});
		else {
			threads.set(id, {
				id,
				name: raw.name+'',
				created: new Date(raw.created),
				parent: raw.parent_id,
				num_children: Number(raw.num_children)
			});
		}
		return id;
	}
	function getChildren(thread: number) {
		const ret :Thread[] = [];
		threads.forEach(t => {
			if( t.parent === thread ) ret.push(t);
		});
		return ret;
	}

	function getThread(id:number) :Thread|undefined {
		return threads.get( id );
	}
	function mustGetThread(id:number) :Thread {
		const t = getThread(id);
		if( !t ) throw new Error("could not find thread "+id);
		return t;
	}

	return {
		getLatestSubThreads, loadChildren, getChildren,
		getThread, mustGetThread
	};

});