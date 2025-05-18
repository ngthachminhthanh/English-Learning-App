using System.Text.Json;
using DiscountService.Events;
using DiscountService.Interfaces;
using StackExchange.Redis;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace DiscountService.Services;

public class RedisSubscriberService : BackgroundService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IServiceProvider _serviceProvider;

    public RedisSubscriberService(IConnectionMultiplexer redis, IServiceProvider serviceProvider)
    {
        _redis = redis;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var subscriber = _redis.GetSubscriber();

        await subscriber.SubscribeAsync(RedisChannel.Literal("discounts"), async (channel, message) =>
        {
            if (message.IsNullOrEmpty)
                return;

            var eventData = JsonSerializer.Deserialize<DiscountEvent>(message);
            if (eventData != null)
            {
                await ProcessDiscountEvent(eventData);
            }
        });
    }

    private async Task ProcessDiscountEvent(DiscountEvent discountEvent)
    {
        using var scope = _serviceProvider.CreateScope();
        var discountService = scope.ServiceProvider.GetRequiredService<IDiscountService>();
        await discountService.CreateOrUpdateDiscountAsync(discountEvent);
    }
}
