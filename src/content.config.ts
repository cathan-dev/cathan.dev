import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const shelf = defineCollection({
    loader: glob({ base: './src/shelf-entries', pattern: '**/*.md' }),
    schema: z.object({
        title: z.string(),
        format: z.enum(['long', 'short']),
        date: z.string(),
        hook: z.string(),
        medium: z.enum(['anime', 'book', 'game', 'manga', 'movie', 'show']),
        verdict: z.enum(['essential', 'worth-it', 'mixed-bag', 'not-worth-it', 'garbage']),
        relationships: z.array(z.enum(['inspiration', 'formative', 'comfort', 'overrated', 'underrated', 'love-hate', 'not-for-me', "didn't-finish"])).max(3)
    }),
});

export const collections = { shelf };