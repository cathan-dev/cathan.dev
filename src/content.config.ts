import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const shelf = defineCollection({
    loader: glob({ base: './src/shelf-entries', pattern: '**/*.md' }),
    schema: z.object({
        title: z.string(),
        draft: z.boolean().default(true),
        format: z.enum(['long', 'short']),
        date: z.string(),
        hook: z.string(),
        quote: z.boolean().default(false),
        medium: z.enum(['anime', 'book', 'game', 'manga', 'movie', 'show']),
        verdict: z.enum(['essential', 'worth-it', 'mixed-bag', 'not-worth-it', 'garbage']),
        relationships: z.array(z.enum(['inspiration', 'formative', 'comfort', 'overrated', 'underrated', 'love-hate', 'not-for-me', "didn't-finish"])).max(3)
    }),
});

const projects = defineCollection({
    loader: glob({ base: './src/project-entries', pattern: '**/*.md' }),
    schema: ({ image }) => z.object({
        title: z.string(),
        preview: image(),
        type: z.enum(['website', 'game', 'skill']),
        description: z.string()
    })
})

export const collections = { shelf, projects };