export default async function navigateTo (connection) {
    const { Target } = connection

    const targets = await Target.getTargets()
    const target = targets.targetInfos.find((t) => t.attached)
    return target.title
}
